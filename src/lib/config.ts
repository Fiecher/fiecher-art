import type { Work } from '$lib/types'

export const APP_CONFIG = {
  name: 'fiecher-art',
  version: '0.0.1',
  author: {
    name: 'Stepan Belebezev',
    email: 'stepanbelebezev@gmail.com',
  },
  social: {
    email: 'stepanbelebezev@gmail.com',
    telegram: 'https://t.me/fiecher',
    github: 'https://github.com/fiecher',
    youtube: 'https://youtube.com/@insomniaCR',
    artstation: 'https://artstation.com/fiecher',
    telegramChannel: 'https://t.me/fiecherWorks',
    behance: 'https://behance.net/fiecher',
  },
} as const

export default APP_CONFIG

/* ──────────────────────────────
     static/works/<work-id>/
       main.mp4      ← main video
       poster.png    ← preview (required for video)
       wip-01.jpg    ← WIP materials (optional)

     id          — unique id
     title       — work title
     year        — year (optional)
     main        — main media file
     wip         — array of WIP materials (optional)
────────────────────────────── */

export const WORKS: Work[] = [
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
    }, {
      type: 'image',
      src: '/works/insomnia-logo/versions.jpg',
    }],
  },
  {
    id: 'test2',
    title: 'test2',
    year: 2024,
    main: {
      type: 'video',
      src: '/works/symptom-bulletin/TheBulletin.mp4',
      poster: '/works/test2/Preview.jpg',
    },
  },
  {
    id: 'test3',
    title: 'test3',
    year: 2024,
    main: {
      type: 'video',
      src: '/works/symptom-bulletin/TheBulletin.mp4',
      poster: '/works/test3/Preview.jpg',
    },
  },
  {
    id: 'test4',
    title: 'test4',
    year: 2024,
    main: {
      type: 'video',
      src: '/works/symptom-bulletin/TheBulletin.mp4',
      poster: '/works/test4/Preview.jpg',
    },
  },
]

const MAIN_PER_SECTION = 4
export const WORK_PAGE_COUNT = Math.max(1, Math.ceil(WORKS.length / MAIN_PER_SECTION))
