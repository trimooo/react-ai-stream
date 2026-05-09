'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { ChatPanel } from '@/components/ChatPanel'

const MODELS = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    tag: 'Best quality',
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    tag: 'Fastest',
  },
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout 17B',
    tag: 'Latest',
  },
] as const

type ModelId = (typeof MODELS)[number]['id']

export default function Page() {
  const [activeModelId, setActiveModelId] = useState<ModelId>(MODELS[0].id)
  const activeModel = MODELS.find((m) => m.id === activeModelId)!

  return (
    <div className="flex h-full bg-gray-950 text-gray-100">
      <Sidebar
        models={MODELS}
        activeModel={activeModelId}
        onModelChange={(id) => setActiveModelId(id as ModelId)}
      />
      {/*
        key={activeModelId} remounts ChatPanel on model change.
        This gives each model a fresh useAIChat instance (isolated message store + client).
        Switching models = new conversation, no stale state.
      */}
      <ChatPanel key={activeModelId} model={activeModel} />
    </div>
  )
}
