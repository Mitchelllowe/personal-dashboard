import { useState } from 'react'
import { BIBLE_BOOKS } from '../lib/bible'

// value: [{ book: string, chapters: number[] }]
// onChange: (newValue) => void
export default function BibleSelector({ value, onChange }) {
  const [search, setSearch] = useState('')

  const selectedMap = Object.fromEntries(value.map(s => [s.book, new Set(s.chapters)]))

  const filtered = BIBLE_BOOKS.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) || !!selectedMap[b.name]
  )

  function toggleBook(bookName) {
    if (selectedMap[bookName]) {
      onChange(value.filter(s => s.book !== bookName))
    } else {
      onChange([...value, { book: bookName, chapters: [] }])
    }
  }

  function toggleChapter(bookName, chapter) {
    onChange(value.map(s => {
      if (s.book !== bookName) return s
      const chapters = new Set(s.chapters)
      chapters.has(chapter) ? chapters.delete(chapter) : chapters.add(chapter)
      return { ...s, chapters: Array.from(chapters).sort((a, b) => a - b) }
    }))
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Search books…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
      />
      {filtered.map(({ name, chapters }) => {
        const isSelected = !!selectedMap[name]
        const selectedChapters = selectedMap[name] ?? new Set()

        return (
          <div key={name}>
            {/* Book chip */}
            <button
              type="button"
              onClick={() => toggleBook(name)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-neutral-700 text-neutral-100'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {name}
              {isSelected && selectedChapters.size > 0 && (
                <span className="ml-2 text-neutral-400 text-xs">
                  Ch. {Array.from(selectedChapters).join(', ')}
                </span>
              )}
            </button>

            {/* Chapter grid — shown when book is selected */}
            {isSelected && (
              <div className="flex flex-wrap gap-1.5 px-1 pt-2 pb-3">
                {Array.from({ length: chapters }, (_, i) => i + 1).map(ch => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChapter(name, ch)}
                    className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                      selectedChapters.has(ch)
                        ? 'bg-neutral-500 text-white'
                        : 'bg-neutral-800 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
