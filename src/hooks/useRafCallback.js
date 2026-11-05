import { useCallback, useEffect, useRef } from 'react'

// Regroupe les appels dans la prochaine frame (un seul rendu par frame).
export function useRafCallback(fn) {
  const fnRef = useRef(fn)
  fnRef.current = fn
  const idRef = useRef(0)

  useEffect(() => () => cancelAnimationFrame(idRef.current), [])

  return useCallback(() => {
    if (idRef.current) return
    idRef.current = requestAnimationFrame(() => {
      idRef.current = 0
      fnRef.current()
    })
  }, [])
}
