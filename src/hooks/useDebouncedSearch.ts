import { useState, useEffect, useRef, useCallback } from 'react'

interface UseDebouncedSearchOptions {
  delay?: number
  onDebouncedChange?: (value: string) => void
}

export function useDebouncedSearch(options: UseDebouncedSearchOptions = {}) {
  const { delay = 300, onDebouncedChange } = options
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      onDebouncedChange?.(searchQuery)
    }, delay)
    return () => clearTimeout(timerRef.current)
  }, [searchQuery, delay, onDebouncedChange])

  const flush = useCallback(() => {
    clearTimeout(timerRef.current)
    setDebouncedSearch(searchQuery)
  }, [searchQuery])

  const reset = useCallback(() => {
    setSearchQuery('')
    setDebouncedSearch('')
  }, [])

  return { searchQuery, setSearchQuery, debouncedSearch, flush, reset }
}
