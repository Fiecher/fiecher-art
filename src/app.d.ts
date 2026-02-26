import type { FilmStripConfig } from '$lib/types'

export const APP_CONFIG = {
  name: 'fiecher-art',
  version: '0.0.1',
  author: {
    name: 'Stepan Belebezev',
    email: 'your@mom.no',
  },
  social: {
    email: 'mailto:your@mom.no',
    telegram: 'https://t.me/yourmom',
    github: 'https://github.com/yourmom',
  },
  filmStrip: {
    cellsPerRow: 3,
    rows: 2,
    maxWidth: '480px',
  } satisfies Partial<FilmStripConfig>,
} as const

export default APP_CONFIG
