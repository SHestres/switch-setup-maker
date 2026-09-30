import { describe, expect, it, vi } from 'vitest'

import { fakeStorage } from '@/test/fakeStorage'
import { sampleDocument } from '@/test/fixtures'

import { serializeDocument } from './serialize'
import { loadDocument, saveDocument, STORAGE_KEY } from './storage'

describe('storage', () => {
  it('loads what it saved', () => {
    const storage = fakeStorage()
    const document = sampleDocument()

    saveDocument(document, storage)

    expect(loadDocument(storage)).toEqual(document)
  })

  it('returns null when nothing has been saved', () => {
    expect(loadDocument(fakeStorage())).toBeNull()
  })

  it('returns null when the saved text is not valid JSON', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect(loadDocument(fakeStorage({ [STORAGE_KEY]: '{"version": 1' }))).toBeNull()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('returns null when the saved document fails validation', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage = fakeStorage({
      [STORAGE_KEY]: serializeDocument(sampleDocument()).replace('"version": 1', '"version": 99'),
    })

    expect(loadDocument(storage)).toBeNull()
    warn.mockRestore()
  })

  it('returns null instead of throwing when storage itself refuses to read', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage: Storage = {
      ...fakeStorage(),
      getItem: () => {
        throw new Error('denied')
      },
    }

    expect(loadDocument(storage)).toBeNull()
    warn.mockRestore()
  })

  it('does not let storage write failures escape', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const storage: Storage = {
      ...fakeStorage(),
      setItem: () => {
        throw new Error('quota exceeded')
      },
    }

    expect(() => saveDocument(sampleDocument(), storage)).not.toThrow()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
