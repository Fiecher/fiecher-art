import { goto } from '$app/navigation'
import { base } from '$app/paths'
import { page } from '$app/stores'
import { derived, get, writable } from 'svelte/store'
import { WORK_PAGE_COUNT } from './config'

export const SECTIONS = ['REEL', 'WORKS', 'INFO'] as const
export type Section = (typeof SECTIONS)[number]

function sectionToSlug(section: Section): string {
  return section.toLowerCase()
}

function slugToSection(slug: string | null): Section | null {
  if (!slug)
    return null
  const upper = slug.toUpperCase() as Section
  return SECTIONS.includes(upper) ? upper : null
}

export const activeSection = writable<Section>('REEL')
export const previousSection = writable<Section | null>(null)
export const isTransitioning = writable(false)
export const worksPage = writable<number>(0)

export const TOTAL_STEPS = (SECTIONS.length - 1) + (WORK_PAGE_COUNT - 1)

export const globalProgress = derived(
  [activeSection, worksPage],
  ([$activeSection, $worksPage]) => {
    if ($activeSection === 'REEL')
      return 0
    if ($activeSection === 'INFO')
      return 1
    const pageIdx = Math.max(0, Math.min($worksPage, WORK_PAGE_COUNT - 1))
    return (1 + pageIdx) / TOTAL_STEPS
  },
)

export function progressToTarget(progress: number): { section: Section, pageIndex?: number } {
  const step = Math.round(progress * TOTAL_STEPS)
  if (step <= 0)
    return { section: 'REEL' }
  if (step >= TOTAL_STEPS)
    return { section: 'INFO' }
  const pageIndex = Math.min(step - 1, WORK_PAGE_COUNT - 1)
  return { section: 'WORKS', pageIndex }
}

function stripBase(pathname: string): string {
  if (!base)
    return pathname
  return pathname.startsWith(base) ?
    pathname.slice(base.length) || '/' :
    pathname
}

function parsePath(pathname: string) {
  const cleaned = stripBase(pathname)
  const parts = cleaned.split('/').filter(Boolean)
  if (parts.length === 0)
    return { section: 'REEL' as Section }
  const section = slugToSection(parts[0])
  return { section }
}

function buildPath(section: Section): string {
  return `${base}/${sectionToSlug(section)}`
}

let transitionTimer = 0

export async function goToSection(target: Section, pageIndex?: number | null) {
  clearTimeout(transitionTimer)

  const current = get(activeSection)
  previousSection.set(current)
  activeSection.set(target)

  if (target === 'WORKS') {
    const currentPage = get(worksPage)
    const pageToUse = pageIndex ?? currentPage ?? 0
    worksPage.set(pageToUse)
  }

  isTransitioning.set(true)
  transitionTimer = window.setTimeout(() => isTransitioning.set(false), 600)

  await goto(buildPath(target), {
    noScroll: true,
    keepFocus: true,
  })
}

export function updateWorksPage(pageIndex: number) {
  worksPage.set(Math.max(0, Math.min(pageIndex, WORK_PAGE_COUNT - 1)))
}

export function navigate(delta: 1 | -1) {
  const section = get(activeSection)
  const currentPage = get(worksPage)

  let currentStep: number
  if (section === 'REEL') {
    currentStep = 0
  } else if (section === 'INFO') {
    currentStep = TOTAL_STEPS
  } else {
    currentStep = 1 + Math.max(0, Math.min(currentPage, WORK_PAGE_COUNT - 1))
  }

  const nextStep = currentStep + delta
  if (nextStep < 0 || nextStep > TOTAL_STEPS)
    return

  const { section: nextSection, pageIndex } = progressToTarget(nextStep / TOTAL_STEPS)
  goToSection(nextSection, pageIndex ?? null)
}

export function initNavigation() {
  const unsubscribe = page.subscribe(($page) => {
    const { section } = parsePath($page.url.pathname)
    if (!section) {
      goto(buildPath('REEL'), { replaceState: true })
      return
    }
    activeSection.set(section)
  })
  return unsubscribe
}
