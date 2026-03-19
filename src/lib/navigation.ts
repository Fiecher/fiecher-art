import { afterNavigate, goto } from '$app/navigation'
import { base } from '$app/paths'
import { derived, get, writable } from 'svelte/store'
import { WORK_PAGE_COUNT, WORKS } from './config'

export const SECTIONS = ['REEL', 'WORKS', 'CONTACT'] as const
export type Section = (typeof SECTIONS)[number]

function sectionToSlug(s: Section) {
  return s.toLowerCase()
}

function slugToSection(slug: string): Section | null {
  const upper = slug.toUpperCase() as Section
  return SECTIONS.includes(upper) ? upper : null
}

function stripBase(pathname: string): string {
  if (!base)
    return pathname
  return pathname.startsWith(base) ?
    pathname.slice(base.length) || '/' :
    pathname
}

export function parsePath(pathname: string): { section: Section | null, workId?: string } {
  const parts = stripBase(pathname).split('/').filter(Boolean)
  if (parts.length === 0)
    return { section: null }
  const section = slugToSection(parts[0])
  if (!section)
    return { section: null }
  if (section === 'WORKS' && parts[1])
    return { section, workId: parts[1] }
  return { section }
}

function buildPath(section: Section) {
  return `${base}/${sectionToSlug(section)}`
}
function buildWorkPath(workId: string) {
  return `${base}/works/${workId}`
}

export const activeSection = writable<Section>('REEL')
export const previousSection = writable<Section | null>(null)
export const isTransitioning = writable(false)
export const worksPage = writable<number>(0)

export const TOTAL_STEPS = (SECTIONS.length - 1) + (WORK_PAGE_COUNT - 1)

export const globalProgress = derived(
  [activeSection, worksPage],
  ([$s, $p]) => {
    if ($s === 'REEL')
      return 0
    if ($s === 'CONTACT')
      return 1
    return (1 + Math.max(0, Math.min($p, WORK_PAGE_COUNT - 1))) / TOTAL_STEPS
  },
)

export function progressToTarget(progress: number): { section: Section, pageIndex?: number } {
  const step = Math.round(progress * TOTAL_STEPS)
  if (step <= 0)
    return { section: 'REEL' }
  if (step >= TOTAL_STEPS)
    return { section: 'CONTACT' }
  return { section: 'WORKS', pageIndex: Math.min(step - 1, WORK_PAGE_COUNT - 1) }
}

let _ownNavCount = 0
let transitionTimer = 0

export async function goToSection(target: Section, pageIndex?: number | null) {
  clearTimeout(transitionTimer)
  previousSection.set(get(activeSection))
  activeSection.set(target)

  if (target === 'WORKS') {
    worksPage.set(pageIndex ?? get(worksPage) ?? 0)
  }

  isTransitioning.set(true)
  transitionTimer = window.setTimeout(() => isTransitioning.set(false), 600)

  _ownNavCount++
  await goto(buildPath(target), { noScroll: true, keepFocus: true })
}

export async function goToWork(workId: string) {
  clearTimeout(transitionTimer)
  previousSection.set(get(activeSection))
  activeSection.set('WORKS')
  isTransitioning.set(true)
  transitionTimer = window.setTimeout(() => isTransitioning.set(false), 600)
  _ownNavCount++
  await goto(buildWorkPath(workId), { noScroll: true, keepFocus: true })
}

export async function closeWorkUrl() {
  _ownNavCount++
  await goto(buildPath('WORKS'), { noScroll: true, keepFocus: true, replaceState: true })
}

export function updateWorksPage(pageIndex: number) {
  worksPage.set(Math.max(0, Math.min(pageIndex, WORK_PAGE_COUNT - 1)))
}

export function navigate(delta: 1 | -1) {
  const section = get(activeSection)
  const currentPage = get(worksPage)
  const currentStep =
    section === 'REEL' ?
      0 :
      section === 'CONTACT' ?
        TOTAL_STEPS :
        1 + Math.max(0, Math.min(currentPage, WORK_PAGE_COUNT - 1))

  const nextStep = currentStep + delta
  if (nextStep < 0 || nextStep > TOTAL_STEPS)
    return
  const { section: s, pageIndex } = progressToTarget(nextStep / TOTAL_STEPS)
  goToSection(s, pageIndex ?? null)
}

function applyUrl(pathname: string) {
  const { section, workId } = parsePath(pathname)

  if (section === null) {
    _ownNavCount++
    goto(buildPath('REEL'), { noScroll: true, replaceState: true })
    return
  }

  if (section === 'WORKS' && workId && !WORKS.find(w => w.id === workId)) {
    _ownNavCount++
    goto(buildPath('REEL'), { noScroll: true, replaceState: true })
    return
  }

  activeSection.set(section)

  if (section === 'WORKS' && workId) {
    const work = WORKS.find(w => w.id === workId)
    if (work) {
      import('./viewer').then(({ openModalSilent }) => openModalSilent(work))
    }
  }
}

export function initNavigation() {
  applyUrl(window.location.pathname)
  const cleanup = afterNavigate(({ type, to }) => {
    if (_ownNavCount > 0) {
      _ownNavCount--
      return
    }
    if (type === 'popstate' && to?.url)
      applyUrl(to.url.pathname)
  })

  return cleanup
}
