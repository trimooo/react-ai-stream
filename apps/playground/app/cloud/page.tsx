import type { Metadata } from 'next'
import { CloudContent } from '@/components/CloudContent'

export const metadata: Metadata = {
  title: 'RAIS Cloud — Hosted AI Gateway',
  description: 'Multi-provider AI gateway built on RAIS Protocol. Free key available. Pro/Team plans on waitlist.',
}

export default function CloudPage() {
  return <CloudContent />
}
