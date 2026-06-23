import { base } from '$app/paths'
import type { Work } from '$lib/types'

export function withBase(path: string): string {
  return `${base}${path}`
}

export const APP_CONFIG = {
  name: 'fiecher-art',
  version: '0.0.1',
  author: {
    name: 'Stepan Belebezev',
    email: 'stepanbelebezev@gmail.com',
  },
  social: {
    email: 'mailto:stepanbelebezev@gmail.com',
    telegram: 'https://t.me/fiecher',
    github: 'https://github.com/fiecher',
    youtube: 'https://youtube.com/@insomniaCR',
    artstation: 'https://artstation.com/fiecher',
    telegramChannel: 'https://t.me/fiecherWorks',
    behance: 'https://www.behance.net/fiecher',
    twitter: 'https://x.com/InsomniaCR_',
    bluesky: 'https://bsky.app/profile/fiecher.bsky.social',
    instagram: 'https://www.instagram.com/fiecher_works/',
    newgrounds: 'https://fiecher.newgrounds.com/',
    reddit: 'https://www.reddit.com/user/InsomniaCR/',
    tiktok: 'https://www.tiktok.com/@fiecher_works',
  },
} as const

export default APP_CONFIG

export const WORKS: Work[] = [
  {
    id: 'deadlock-doorman',
    title: 'Doorman from Deadlock',
    year: 2026,
    main: {
      type: 'image',
      src: '/works/deadlock-doorman/Render.jpg',
      poster: '/works/deadlock-doorman/Preview.jpg',
      description: {
        ru: 'Бла.',
        en: 'Blah.',
      },
    },
    wip: [
      {
        type: 'image',
        src: '/works/deadlock-doorman/WIP1.jpg',
      },
      {
        type: 'image',
        src: '/works/deadlock-doorman/WIP2.jpg',
      },
    ],
  },
  {
    id: 'symptom-disturbia',
    title: 'Disturbia',
    year: 2026,
    main: {
      type: 'video',
      src: '/works/symptom-disturbia/Disturbia.mp4',
      poster: '/works/symptom-disturbia/Preview.png',
    },
    wip: [
      {
        type: 'image',
        src: '/works/symptom-disturbia/model-render.jpg',
      },
      {
        type: 'image',
        src: '/works/symptom-disturbia/model-viewport.jpg',
      },
    ],
  },
  {
    id: 'symptom-bulletin',
    title: 'The Bulletin',
    year: 2025,
    main: {
      type: 'video',
      src: '/works/symptom-bulletin/TheBulletin.mp4',
      poster: '/works/symptom-bulletin/Preview.png',
    },
    wip: [{
      type: 'image',
      src: '/works/symptom-bulletin/model-render.jpg',
    }, {
      type: 'image',
      src: '/works/symptom-bulletin/model-viewport.jpg',
    }],
  },
  {
    id: 'takin-whats-not-yours',
    title: 'Taking What\'s Not Yours',
    year: 2026,
    main: {
      type: 'video',
      src: '/works/tv/Render.mp4',
      poster: '/works/tv/Preview.jpg',
    },
  },
  {
    id: 'soft-studio',
    title: 'Soft Studio Promo',
    year: 2023,
    main: {
      type: 'video',
      src: '/works/soft-studio/SoftStudio.mp4',
      poster: '/works/soft-studio/Preview.jpg',
    },
  },
  {
    id: 'insomnia-logo',
    title: 'Insomnia Creative Logo',
    year: 2023,
    main: {
      type: 'video',
      src: '/works/insomnia-logo/Insomnia.mp4',
      poster: '/works/insomnia-logo/Preview.jpg',
    },
    wip: [{
      type: 'image',
      src: '/works/insomnia-logo/color-variants.jpg',
    }],
  },
  {
    id: 'nosweat-logo',
    title: 'No Sweat Logo',
    year: 2021,
    main: {
      type: 'video',
      src: '/works/nosweat-logo/NoSweat.mp4',
      poster: '/works/nosweat-logo/Preview.jpg',
    },
    wip: [{
      type: 'image',
      src: '/works/nosweat-logo/color-pallete.png',
    }],
  },
  {
    id: 'revolution-br',
    title: 'Revolution BR Teaser',
    year: 2021,
    main: {
      type: 'video',
      src: '/works/revolution-br/RevolutionBR.mp4',
      poster: '/works/revolution-br/Preview.jpg',
    },
    wip: [{
      type: 'image',
      src: '/works/revolution-br/ShadowLogo.jpg',
    }, {
      type: 'image',
      src: '/works/revolution-br/NoSignal.jpg',
    }],
  },
  {
    id: 'commander-tartar',
    title: 'Commander Tartar',
    year: 2026,
    main: {
      type: 'image',
      src: '/works/commander-tartar/Preview.png',
    },
  },
  {
    id: 'control-casper_darling',
    title: 'Casper Darling',
    year: 2026,
    main: {
      type: 'image',
      src: '/works/control-casper_darling/Preview.jpg',
    },
    wip: [{
      type: 'image',
      src: '/works/control-casper_darling/WIP1.jpg',
    }, {
      type: 'image',
      src: '/works/control-casper_darling/WIP2.jpg',
    }],
  },
  {
    id: 'zavodchane-promo',
    title: 'BIZ Agent Promo',
    year: 2026,
    main: {
      type: 'video',
      src: '/works/zavodchane-promo/Main.mp4',
      poster: '/works/zavodchane-promo/Preview.jpg',
    },
  },
]

export const WORK_PAGE_COUNT = Math.max(1, Math.ceil(WORKS.length / 4))
