import { useState, useCallback } from 'react'

export function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), resetMs)
      } catch {
        // clipboard not available
      }
    },
    [resetMs],
  )

  return { copied, copy }
}
