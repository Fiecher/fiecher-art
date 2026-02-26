export type MenuItem = string

export type NavigationItems = readonly MenuItem[]

export interface FilmCell {
  id: string
  content?: string
}

export interface FilmStripConfig {
  cells: FilmCell[]
  rows?: number
  maxWidth?: string
}

export interface FooterItem {
  label: string
  value: string | string[]
}
