import { useState, useRef, type KeyboardEvent } from 'react'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop?: (() => void) | undefined
  loading?: boolean | undefined
  placeholder?: string | undefined
  disabled?: boolean | undefined
}

export function ChatInput({
  onSend,
  onStop,
  loading,
  placeholder = 'Type a message…',
  disabled,
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed || loading) return
    onSend(trimmed)
    setValue('')
    textareaRef.current?.focus()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="ras-input">
      <textarea
        ref={textareaRef}
        className="ras-input__textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        rows={1}
        aria-label="Chat message input"
      />
      {loading && onStop ? (
        <button className="ras-input__btn ras-input__btn--stop" onClick={onStop} type="button">
          Stop
        </button>
      ) : (
        <button
          className="ras-input__btn ras-input__btn--send"
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          type="button"
        >
          Send
        </button>
      )}
    </div>
  )
}
