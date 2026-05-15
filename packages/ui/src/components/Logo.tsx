const INK = '#0E1116'
const PAPER = '#F6F4EF'
const ACCENT = '#3B5BFF'

export function LogoMark({ size = 32, dark = true }: { size?: number; dark?: boolean }) {
  const bg = dark ? INK : PAPER
  const fg = dark ? PAPER : INK
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="react-ai-stream">
      <rect x="0" y="0" width="100" height="100" rx="14" fill={bg} />
      <path d="M28 22 H58 a16 16 0 0 1 0 32 H44 L62 78 H50 L34 56 H40 V46 H56 a6 6 0 0 0 0 -12 H40 V78 H28 Z" fill={fg} />
      <rect x="0" y="56" width="100" height="4" fill={ACCENT} />
      <circle cx="86" cy="58" r="6" fill={ACCENT} stroke={bg} strokeWidth="3" />
    </svg>
  )
}

export function LogoLockup({ size = 28, dark = true }: { size?: number; dark?: boolean }) {
  const textColor = dark ? '#f1f5f9' : '#0f172a'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <LogoMark size={size} dark={dark} />
      <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', color: textColor }}>
        react-ai-stream
      </span>
    </div>
  )
}
