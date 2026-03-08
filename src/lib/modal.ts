import { writable } from 'svelte/store'
import type { Work } from '$lib/types'

export const modalCell = writable<Work | null>(null)

export function openModal(cell: Work) {
  modalCell.set(cell)
}

export function closeModal() {
  modalCell.set(null)
}
