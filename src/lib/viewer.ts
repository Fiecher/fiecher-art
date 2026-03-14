import { writable } from 'svelte/store'
import type { Work } from '$lib/types'

export const modalCell = writable<Work | null>(null)
export const isVideoFullscreen = writable(false)

export function openModal(cell: Work) {
  modalCell.set(cell)
  import('./navigation').then(({ goToWork }) => goToWork(cell.id))
}

export function openModalSilent(cell: Work) {
  modalCell.set(cell)
}

export function closeModal() {
  modalCell.set(null)
  import('./navigation').then(({ closeWorkUrl }) => closeWorkUrl())
}
