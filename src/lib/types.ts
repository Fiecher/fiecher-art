export interface WorkMedia {
  type: 'video' | 'image'
  src: string
  poster?: string
  caption?: string
}

export interface Work {
  id: string
  title: string
  description?: string
  year?: number
  main: WorkMedia
  wip?: WorkMedia[]
}

export interface FilmCell {
  id: string
  title?: string
  image?: string
}
