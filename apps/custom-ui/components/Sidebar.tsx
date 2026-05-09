'use client'

interface Model {
  readonly id: string
  readonly name: string
  readonly tag: string
}

interface SidebarProps {
  models: readonly Model[]
  activeModel: string
  onModelChange: (id: string) => void
}

export function Sidebar({ models, activeModel, onModelChange }: SidebarProps) {
  return (
    <aside className="w-60 shrink-0 flex flex-col bg-gray-900 border-r border-gray-800">
      {/* Header */}
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 4.5C2 3.67 2.67 3 3.5 3h7C11.33 3 12 3.67 12 4.5v5c0 .83-.67 1.5-1.5 1.5h-7C2.67 11 2 10.33 2 9.5v-5z" stroke="white" strokeWidth="1.2" />
              <path d="M5 6.5h4M5 8.5h2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-100 leading-none">react-ai-stream</p>
            <p className="text-xs text-gray-500 mt-0.5">custom-ui example</p>
          </div>
        </div>
      </div>

      {/* Model list */}
      <div className="px-3 py-4 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
          Models
        </p>
        <nav className="space-y-1">
          {models.map((model) => {
            const active = activeModel === model.id
            return (
              <button
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                  active
                    ? 'bg-indigo-600/15 border border-indigo-600/40 text-indigo-200'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent'
                }`}
              >
                <p className="text-sm font-medium leading-none mb-1">{model.name}</p>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                    active
                      ? 'bg-indigo-900/60 text-indigo-400'
                      : 'bg-gray-800 text-gray-600'
                  }`}
                >
                  {model.tag}
                </span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-600 leading-relaxed">
          This UI uses only{' '}
          <code className="text-gray-500 font-mono text-xs">@react-ai-stream/react</code>
          .{' '}
          No{' '}
          <code className="text-gray-500 font-mono text-xs">@react-ai-stream/ui</code>
          {' '}dependency.
        </p>
      </div>
    </aside>
  )
}
