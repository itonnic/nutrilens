import type { SVGProps } from 'react';

export function NutriLensMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" fill="none" role="img" aria-label="NutriLens" {...props}>
      <circle cx="30" cy="30" r="22" fill="#FFFFFF" stroke="#67B26F" strokeWidth="3" />
      <circle cx="30" cy="30" r="13" fill="#B8E986" opacity="0.34" />
      <path
        d="M19 30c4-7 12-10 21-7"
        stroke="#FF9F6E"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="30" cy="30" r="6" stroke="currentColor" strokeWidth="3" />
      <path d="M43 43l10 10" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <circle cx="26" cy="26" r="2.5" fill="#A78BFA" />
    </svg>
  );
}
