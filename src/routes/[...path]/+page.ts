import { WORKS } from '$lib/config'
import { parsePath } from '$lib/navigation'
import { redirect } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const prerender = true

export function entries() {
  return [
    { path: '' },
    { path: 'reel' },
    { path: 'works' },
    { path: 'contact' },
    ...WORKS.map(w => ({ path: `works/${w.id}` })),
  ]
}

export const load: PageLoad = ({ url }) => {
  const stripped = url.pathname.replace(/^\//, '')
  if (stripped === '' || stripped === '/') {
    redirect(307, '/reel')
  }

  const { section } = parsePath(url.pathname)
  if (section === null) {
    redirect(307, '/404')
  }
}
