import type { SVGProps } from 'react';

export function PhotoDiaryHero(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 420 420"
      fill="none"
      role="img"
      aria-labelledby="photo-diary-hero-title photo-diary-hero-desc"
      {...props}
    >
      <title id="photo-diary-hero-title">Photo-first food diary preview</title>
      <desc id="photo-diary-hero-desc">
        An abstract meal photo card with a lens scan and nutrition signals.
      </desc>
      <rect x="54" y="38" width="312" height="344" rx="34" fill="#FFFFFF" />
      <rect x="55" y="39" width="310" height="342" rx="33" stroke="#FFFFFF" strokeWidth="2" />
      <rect x="82" y="70" width="256" height="214" rx="28" fill="#F8F7F2" />
      <circle cx="210" cy="177" r="76" fill="#FFFFFF" />
      <path
        d="M157 165c18-31 57-43 94-26"
        stroke="#67B26F"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <path
        d="M238 203c-20 21-55 25-80 8"
        stroke="#F7D774"
        strokeWidth="24"
        strokeLinecap="round"
      />
      <circle cx="244" cy="166" r="25" fill="#FF9F6E" />
      <circle cx="198" cy="132" r="16" fill="#B8E986" />
      <circle cx="269" cy="215" r="13" fill="#A78BFA" />
      <circle cx="210" cy="177" r="93" stroke="currentColor" strokeOpacity="0.1" strokeWidth="2" />
      <path
        d="M120 123c17-21 45-34 78-34"
        stroke="#5EE3D8"
        strokeWidth="6"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      <path
        d="M300 244c-17 22-46 34-80 34"
        stroke="#7CC5FF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
      <rect x="104" y="306" width="132" height="12" rx="6" fill="currentColor" opacity="0.9" />
      <rect x="104" y="330" width="82" height="10" rx="5" fill="currentColor" opacity="0.35" />
      <rect x="250" y="308" width="66" height="28" rx="14" fill="#67B26F" opacity="0.18" />
      <path d="M268 322h30" stroke="#67B26F" strokeWidth="5" strokeLinecap="round" />
      <rect x="82" y="70" width="256" height="214" rx="28" stroke="currentColor" strokeOpacity="0.06" />
    </svg>
  );
}
