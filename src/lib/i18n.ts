import { get, writable } from 'svelte/store'

export type Locale = 'ru' | 'en'

export type Localized = string | Partial<Record<Locale, string>>

const STORAGE_KEY = 'fiecher-lang'

function detect(): Locale {
  if (typeof window === 'undefined')
    return 'en'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'ru' || stored === 'en')
      return stored
  } catch {}
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
  return langs.some(l => l.toLowerCase().startsWith('ru')) ? 'ru' : 'en'
}

export const lang = writable<Locale>(detect())

export function setLang(l: Locale) {
  lang.set(l)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {}
  }
}

export function toggleLang() {
  setLang(get(lang) === 'ru' ? 'en' : 'ru')
}

export function localize(value: Localized | undefined | null, l: Locale): string {
  if (value == null)
    return ''
  if (typeof value === 'string')
    return value
  return value[l] ?? value.en ?? value.ru ?? ''
}
