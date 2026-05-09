import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { AppConfigService } from '../../config/app-config.service';

export interface StoredImage {
  imageUrl: string;
  thumbnailUrl: string;
  imageKey: string;
  thumbnailKey: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;

  constructor(private readonly config: AppConfigService) {}

  onModuleInit() {
    if (this.config.storageDriver === 's3') {
      const s3 = this.config.s3Config;
      if (!s3.bucket || !s3.accessKeyId || !s3.secretAccessKey) {
        throw new Error(
          'S3 storage requires S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY',
        );
      }
      // Cloudflare R2 uses an S3-compatible endpoint scoped to the account
      // (e.g. https://<account-id>.r2.cloudflarestorage.com). Both R2 and AWS
      // S3 work through the same SDK; we just hand the right endpoint+region.
      this.s3Client = new S3Client({
        endpoint: s3.endpoint,
        region: s3.region,
        credentials: {
          accessKeyId: s3.accessKeyId,
          secretAccessKey: s3.secretAccessKey,
        },
        // R2 ignores AWS-style request signing checksums; force the SDK off.
        forcePathStyle: !!s3.endpoint,
      });
      this.logger.log(`Storage driver: s3 (bucket=${s3.bucket}, endpoint=${s3.endpoint ?? 'aws'})`);
    } else {
      this.logger.log(`Storage driver: local (path=${this.config.storageLocalPath})`);
    }
  }

  async storeMealImage(buffer: Buffer, mimeType: string): Promise<StoredImage> {
    const ext = this.extensionFor(mimeType);
    const id = uuidv4();
    const imageKey = `meals/${id}${ext}`;
    const thumbnailKey = `meals/${id}-thumb.jpg`;

    const optimized = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();

    const thumbnail = await sharp(buffer)
      .rotate()
      .resize({ width: 400, height: 400, fit: 'cover' })
      .jpeg({ quality: 78 })
      .toBuffer();

    if (this.config.storageDriver === 'local') {
      await this.writeLocal(imageKey, optimized);
      await this.writeLocal(thumbnailKey, thumbnail);
      return {
        imageUrl: this.localUrl(imageKey),
        thumbnailUrl: this.localUrl(thumbnailKey),
        imageKey,
        thumbnailKey,
      };
    }

    // S3 / R2 driver
    await this.writeS3(imageKey, optimized, this.mimeFor(imageKey));
    await this.writeS3(thumbnailKey, thumbnail, 'image/jpeg');
    return {
      imageUrl: this.s3Url(imageKey),
      thumbnailUrl: this.s3Url(thumbnailKey),
      imageKey,
      thumbnailKey,
    };
  }

  async deleteMealImage(imageKey: string, thumbnailKey: string): Promise<void> {
    if (this.config.storageDriver === 'local') {
      await this.deleteLocal(imageKey).catch(() => undefined);
      await this.deleteLocal(thumbnailKey).catch(() => undefined);
      return;
    }
    await this.deleteS3(imageKey).catch((err) => {
      this.logger.warn(`Failed to delete s3 object ${imageKey}: ${err}`);
    });
    await this.deleteS3(thumbnailKey).catch((err) => {
      this.logger.warn(`Failed to delete s3 object ${thumbnailKey}: ${err}`);
    });
  }

  /**
   * Load the optimized meal image as a buffer + its mime type. Used by the AI
   * pipeline so we can ship the bytes inline (base64) to providers like Gemini
   * or OpenAI even when the public bucket URL isn't reachable from the model
   * worker.
   */
  async readMealImage(
    imageKey: string,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    if (this.config.storageDriver === 'local') {
      const fullPath = path.join(this.config.storageLocalPath, imageKey);
      const buffer = await fs.readFile(fullPath);
      return { buffer, mimeType: this.mimeFor(imageKey) };
    }

    const buffer = await this.readS3(imageKey);
    return { buffer, mimeType: this.mimeFor(imageKey) };
  }

  private mimeFor(keyOrPath: string): string {
    if (keyOrPath.endsWith('.png')) return 'image/png';
    if (keyOrPath.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  }

  private async writeLocal(key: string, data: Buffer): Promise<void> {
    const fullPath = path.join(this.config.storageLocalPath, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
  }

  private async deleteLocal(key: string): Promise<void> {
    const fullPath = path.join(this.config.storageLocalPath, key);
    await fs.unlink(fullPath);
  }

  private localUrl(key: string): string {
    return `${this.config.storagePublicBaseUrl.replace(/\/$/, '')}/${key}`;
  }

  private async writeS3(key: string, data: Buffer, contentType: string): Promise<void> {
    const client = this.requireS3();
    await client.send(
      new PutObjectCommand({
        Bucket: this.config.s3Config.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
        // 1 year — meal images are immutable once uploaded; the URL itself
        // contains a UUID so cache-busting is automatic.
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  }

  private async readS3(key: string): Promise<Buffer> {
    const client = this.requireS3();
    const res = await client.send(
      new GetObjectCommand({
        Bucket: this.config.s3Config.bucket,
        Key: key,
      }),
    );
    const stream = res.Body as NodeJS.ReadableStream | undefined;
    if (!stream) throw new Error(`Empty body reading s3 object ${key}`);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer));
    }
    return Buffer.concat(chunks);
  }

  private async deleteS3(key: string): Promise<void> {
    const client = this.requireS3();
    await client.send(
      new DeleteObjectCommand({
        Bucket: this.config.s3Config.bucket,
        Key: key,
      }),
    );
  }

  private requireS3(): S3Client {
    if (!this.s3Client) throw new Error('S3 client not initialized');
    return this.s3Client;
  }

  /**
   * Public URL the browser will GET. With R2 the bucket needs either:
   *   1. "Public Bucket" access enabled — `https://pub-<hash>.r2.dev/<key>`, or
   *   2. A custom domain attached to the bucket.
   * Configure the chosen base URL via `S3_PUBLIC_BASE_URL`.
   */
  private s3Url(key: string): string {
    const base = this.config.s3Config.publicBaseUrl.replace(/\/$/, '');
    if (!base) {
      throw new Error('S3_PUBLIC_BASE_URL is required when STORAGE_DRIVER=s3');
    }
    return `${base}/${key}`;
  }

  private extensionFor(mimeType: string): string {
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/webp') return '.webp';
    return '.jpg';
  }
}
