import type { Metadata } from 'next'
import { CloudContent } from '@/components/CloudContent'

export const metadata: Metadata = {
  title: 'RAIS Cloud — Hosted AI Gateway',
  description: 'Multi-provider AI gateway built on RAIS Protocol. Free key available. Pro/Team plans on waitlist.',
}

export default async function CloudPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; plan?: string }>
}) {
  const params = await searchParams
  return <CloudContent checkoutStatus={params.checkout} checkoutPlan={params.plan} />
}
