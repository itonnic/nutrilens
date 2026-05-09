import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg,#67B26F 0%,#B8E986 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 14,
        }}
      >
        <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
          <circle cx="30" cy="30" r="22" fill="#ffffff" />
          <circle cx="30" cy="30" r="13" fill="#B8E986" opacity="0.6" />
          <path
            d="M19 30c4-7 12-10 21-7"
            stroke="#FF9F6E"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="30" cy="30" r="6" stroke="#1F2420" strokeWidth="3" />
          <path d="M43 43l10 10" stroke="#1F2420" strokeWidth="5" strokeLinecap="round" />
          <circle cx="26" cy="26" r="2.5" fill="#A78BFA" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
