import type { ReactNode } from 'react'

function renderInline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>
      }
      return <span key={index}>{part}</span>
    })
}

/** Minimal markdown renderer for release notes (headings, bullets, quotes, bold). */
export function ReleaseNotes({ notes }: { notes: string }): React.JSX.Element {
  const blocks: ReactNode[] = []
  let list: string[] = []

  const flushList = (): void => {
    if (list.length === 0) return
    blocks.push(
      <ul key={`list-${blocks.length}`}>
        {list.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>
    )
    list = []
  }

  for (const line of notes.split('\n')) {
    if (line.startsWith('- ')) {
      list.push(line.slice(2))
      continue
    }

    flushList()

    if (!line.trim()) continue
    if (line.startsWith('#')) {
      blocks.push(<h4 key={blocks.length}>{line.replace(/^#+\s*/, '')}</h4>)
    } else if (line.startsWith('> ')) {
      blocks.push(<blockquote key={blocks.length}>{line.slice(2)}</blockquote>)
    } else {
      blocks.push(<p key={blocks.length}>{renderInline(line)}</p>)
    }
  }

  flushList()

  return <div className="release-notes">{blocks}</div>
}
