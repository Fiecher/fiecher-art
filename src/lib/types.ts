import type { Localized } from '$lib/i18n'

export interface WorkMedia {
  type: 'video' | 'image'
  src: string
  poster?: string
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
