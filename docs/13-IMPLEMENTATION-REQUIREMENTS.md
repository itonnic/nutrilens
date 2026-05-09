# 13 — Implementation Requirements

---

## Code Quality

- Use TypeScript everywhere.
- Use clean modular architecture.
- Use DTOs and validation on backend.
- Use Zod validation on frontend.
- Use proper loading/error states.
- Use optimistic UI only where safe.
- Keep AI logic isolated in service layer.
- Do not hardcode provider-specific logic directly in controllers.

---

## Security

- Validate file type and size.
- Only allow image uploads.
- Store images in object storage, not database.
- Use signed URLs where needed.
- Protect all user data by `userId`.
- Never expose another user's meals.
- Rate limit AI analysis endpoint.
- Limit image upload size.
- Sanitize user notes.

---

## Privacy

Nutrition data can be sensitive.

Add:
- Privacy policy placeholder
- Delete account option (later)
- Image deletion option
- Clear disclaimer

---

## Performance

- Compress images before upload if possible.
- Generate thumbnails.
- Use lazy loading for meal images.
- Cache dashboard summaries.
- Queue AI analysis jobs.
- Do not block frontend for too long.
