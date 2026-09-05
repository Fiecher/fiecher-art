import type { Localized } from '$lib/i18n'

export interface WorkMedia {
  type: 'video' | 'image'
  src: string
  poster?: string
  /** Small pre-downscaled image used for the Works film-strip cells only.
   *  Keep this near the strip's rendered size (a few hundred px) — the strip
   *  preloads every work's thumbnail up front and draws them every animation
   *  frame, so a full-resolution poster/src here balloons decoded-bitmap
   *  memory and causes GC/eviction jank while scrolling. Falls back to
   *  poster/src if omitted. */
  thumb?: string
  caption?: Localized
  name?: string
  description?: Localized
}

export interface Work {
  id: string
  title: string
  description?: Localized
  year?: number
  main: WorkMedia
  wip?: WorkMedia[]
}

export interface FilmCell {
  id: string
  title?: string
  image?: string
}
