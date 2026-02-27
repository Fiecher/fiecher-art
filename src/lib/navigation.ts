import { get, writable } from 'svelte/store'

export const SECTIONS = ['REEL', 'WORKS', 'INFO'] as const
export type Section = (typeof SECTIONS)[number]

function sectionToSlug(section: Section) {
  return section.toLowerCase()
}

function slugToSection(slug: string | null): Section | null {
  if (!slug)
    return null
  const upper = slug.toUpperCase() as Section
  return SECTIONS.includes(upper) ? upper : null
}

export const activeSection = writable<Section>('REEL')
export const isTransitioning = writable(false)

export function goToSection(target: Section) {
  if (target === get(activeSection) || get(isTransitioning))
    return

  activeSection.set(target)
  isTransitioning.set(true)
  setTimeout(() => isTransitioning.set(false), 600)

  const url = new URL(window.location.href)
  url.searchParams.set('page', sectionToSlug(target))
  window.history.pushState({ page: sectionToSlug(target) }, '', url)
}

export function initNavigation() {
  const slug = new URL(window.location.href).searchParams.get('page')
  const fromUrl = slugToSection(slug)

  if (fromUrl) {
    activeSection.set(fromUrl)
  } else {
    const url = new URL(window.location.href)
    url.searchParams.set('page', sectionToSlug(get(activeSection)))
    window.history.replaceState({ page: sectionToSlug(get(activeSection)) }, '', url)
  }

  const onPopState = (e: PopStateEvent) => {
    const next =
      slugToSection(e.state?.page ?? null) ??
      slugToSection(new URL(window.location.href).searchParams.get('page'))
    if (next)
      activeSection.set(next)
  }

  window.addEventListener('popstate', onPopState)
  return () => window.removeEventListener('popstate', onPopState)
}
