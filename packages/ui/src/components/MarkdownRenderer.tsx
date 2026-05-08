import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard.js'
import type { Components } from 'react-markdown'

function CodeBlock({ children, className }: { children?: React.ReactNode | undefined; className?: string | undefined }) {
  const { copied, copy } = useCopyToClipboard()
  const code = typeof children === 'string' ? children : String(children ?? '')
  const isInline = !className

  if (isInline) {
    return <code className="ras-code-inline">{children}</code>
  }

  return (
    <div className="ras-code-block">
      <button
        className="ras-code-copy"
        onClick={() => copy(code.replace(/\n$/, ''))}
        aria-label={copied ? 'Copied' : 'Copy code'}
      >
        {copied ? '✓' : 'Copy'}
      </button>
      <code className={className}>{children}</code>
    </div>
  )
}

const components: Components = {
  code: ({ className, children }) => (
    <CodeBlock className={className}>{children}</CodeBlock>
  ),
  pre: ({ children }) => <pre className="ras-pre">{children}</pre>,
}

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={`ras-markdown ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
