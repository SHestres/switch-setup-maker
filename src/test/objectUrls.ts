import { vi } from 'vitest'

/**
 * jsdom implements neither object URLs nor downloads, so stub them and capture
 * what the app hands to the browser.
 */
export function stubObjectUrls(): { created: Blob[]; downloads: string[] } {
  const created: Blob[] = []
  const downloads: string[] = []

  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: (blob: Blob) => {
      created.push(blob)
      return `blob:test-${created.length}`
    },
  })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => {} })

  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push(this.download)
  })

  return { created, downloads }
}

export function restoreObjectUrls(): void {
  Reflect.deleteProperty(URL, 'createObjectURL')
  Reflect.deleteProperty(URL, 'revokeObjectURL')
}
