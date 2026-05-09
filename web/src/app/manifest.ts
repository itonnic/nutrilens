import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NutriLens — AI nutrition tracker',
    short_name: 'NutriLens',
    description:
      'Track your meals from photos. Estimate calories and macros in seconds.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#F8F7F2',
    theme_color: '#67B26F',
    orientation: 'portrait',
    categories: ['health', 'lifestyle', 'food'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon', sizes: '64x64', type: 'image/png', purpose: 'any' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
