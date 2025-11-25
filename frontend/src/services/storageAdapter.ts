const isBrowser = typeof window !== 'undefined'

const getStorage = (): Storage | null => {
  if (!isBrowser) return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export async function getItem<T>(key: string): Promise<T | null> {
  const storage = getStorage()
  if (!storage) return null
  const raw = storage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  const storage = getStorage()
  if (!storage) return
  storage.setItem(key, JSON.stringify(value))
}







