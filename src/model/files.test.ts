import { afterEach, describe, expect, it, vi } from 'vitest'

import { sampleDocument } from '@/test/fixtures'
import { restoreObjectUrls, stubObjectUrls } from '@/test/objectUrls'

import { exportDocumentFile, importDocumentFile } from './files'
import { serializeDocument } from './serialize'

afterEach(() => {
  restoreObjectUrls()
  vi.restoreAllMocks()
})

describe('exportDocumentFile', () => {
  it('downloads the pretty-printed document under a dated filename', async () => {
    const { created, downloads } = stubObjectUrls()

    exportDocumentFile(sampleDocument())

    expect(downloads[0]).toMatch(/^switch-setup-\d{4}-\d{2}-\d{2}\.json$/)
    expect(created).toHaveLength(1)
    expect(await created[0].text()).toBe(serializeDocument(sampleDocument()))
  })
})

describe('importDocumentFile', () => {
  it('parses a chosen file', async () => {
    const file = new File([serializeDocument(sampleDocument())], 'setup.json', {
      type: 'application/json',
    })

    expect(await importDocumentFile(file)).toEqual({ ok: true, document: sampleDocument() })
  })

  it('reports an invalid file without throwing', async () => {
    const file = new File(['{"version": 99}'], 'setup.json', { type: 'application/json' })

    const result = await importDocumentFile(file)

    expect(result.ok).toBe(false)
  })
})
