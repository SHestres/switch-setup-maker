import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { fakeStorage } from '@/test/fakeStorage'
import { sampleDocument } from '@/test/fixtures'

import { resetSetup } from './document'
import { serializeDocument } from './serialize'
import { STORAGE_KEY } from './storage'
import { useDocument } from './useDocument'

describe('useDocument', () => {
  it('restores the autosaved document on load', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: serializeDocument(sampleDocument()) })

    const { result } = renderHook(() => useDocument(storage))

    expect(result.current.document).toEqual(sampleDocument())
  })

  it('starts from an empty document when nothing has been saved', () => {
    const { result } = renderHook(() => useDocument(fakeStorage()))

    expect(result.current.document.setup).toEqual({ switches: [], connections: [] })
    expect(result.current.document.version).toBe(2)
  })

  it('autosaves every change', () => {
    const storage = fakeStorage()
    const { result } = renderHook(() => useDocument(storage))

    act(() => {
      result.current.setDocument(sampleDocument())
    })

    expect(storage.getItem(STORAGE_KEY)).toBe(serializeDocument(sampleDocument()))
  })

  it('accepts updater functions, as the canvas and builder will', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: serializeDocument(sampleDocument()) })
    const { result } = renderHook(() => useDocument(storage))

    act(() => {
      result.current.setDocument((current) => resetSetup(current))
    })

    expect(result.current.document.setup.switches).toEqual([])
    expect(result.current.document.ui.theme).toBe(sampleDocument().ui.theme)
  })
})
