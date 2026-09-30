/** An in-memory Storage for tests, so autosave tests never touch jsdom's own localStorage. */
export function fakeStorage(initial: Record<string, string> = {}): Storage {
  const items = new Map(Object.entries(initial))

  return {
    get length() {
      return items.size
    },
    clear: () => {
      items.clear()
    },
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key)
    },
    setItem: (key, value) => {
      items.set(key, value)
    },
  }
}
