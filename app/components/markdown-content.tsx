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
            h1: ({ children }) => <h1 className="text-3xl font-bold mb-4">{children}</h1>,
            h2: ({ children }) => <h2 className="text-2xl font-semibold mb-3">{children}</h2>,
            p: ({ children }) => <p className="mb-3 leading-7">{children}</p>,
            a: ({ children, href }) => (
              <a
                href={href}
                className="text-blue-600 underline hover:text-blue-800"
                target="_blank"
                rel="noreferrer"
              >
                {children}
              </a>
            ),
        }}>
        {children}
      </ReactMarkdown>
    </div>
  )
}