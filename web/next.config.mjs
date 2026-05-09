import createNextIntlPlugin from 'next-intl/plugin';

// Wires next-intl into the Next build so the request config is found,
// types for `useTranslations(...)` keys are inferred from messages/en.json,
// and per-locale routing works.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nutrilens/shared'],
  // Built-in gzip compression on `next start` is on by default, but make it explicit so we
  // notice if it ever flips off in a future Next.js release.
  compress: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default withNextIntl(nextConfig);
