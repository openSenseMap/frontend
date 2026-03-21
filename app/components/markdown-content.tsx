import ReactMarkdown from 'react-markdown'

type MarkdownContentProps = {
  children: string
  className?: string
}

export function MarkdownContent({
  children,
  className = '',
}: MarkdownContentProps) {
  return (
    <div className={`prose max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 text-3xl font-bold">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-8 text-2xl font-semibold">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-6 text-xl font-semibold">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="mb-3 leading-7">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 list-disc pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal pl-6">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="mb-1 leading-7">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          hr: () => <hr className="my-6 border-border" />,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}