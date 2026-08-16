import { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// HeroCellDemo
// A sparse slice of a real data table. The triangle is formed by giving each
// column a different number of rows — short on the left, tallest on the right
// (no clip mask) — so it reads as a table continuing off-screen. Every cell is
// static filler except the live Stage cell, which loops through the editable-
// cell lifecycle from the Figma reference, narrated keyboard-first (focus
// rings, arrow-key navigation, save press):
//
//   idle → focus → open → navigate → selected → save → sync → (loop)
//
// Every transition holds < 1500ms. The Stage column is deliberately tall so the
// open listbox always lands on rendered rows and never spills out of bounds.
// ---------------------------------------------------------------------------

const OPTIONS = ['Negotiate', 'Closed Lost', 'Closed Won']
const START = 'Negotiate'
const TARGET = 'Closed Won'

// Columns left → right, with increasing row counts so the last column is the
// tallest. `null` marks the single live cell (in the second-last column).
const COLUMNS = [
  {
    key: 'Account',
    width: 186,
    rows: ['Northwind Traders', 'Umbrella Corp'],
  },
  {
    key: 'Stage',
    width: 232,
    rows: [null, 'Discovery', 'Proposal', 'Qualified', 'Closed Won'],
  },
  {
    key: 'Owner',
    width: 148,
    rows: ['A. Rivera', 'K. Patel', 'S. Okafor', 'M. Chen', 'L. Nguyen', 'D. Silva', 'R. Adaeze', 'T. Bauer'],
  },
]

// Ordered phases + how long each holds before advancing — all under 1500ms.
const PHASES = [
  { key: 'idle', ms: 1200 },
  { key: 'focus', ms: 1050 },
  { key: 'open', ms: 1250 },
  { key: 'navigate', ms: 1100 },
  { key: 'selected', ms: 1050 },
  { key: 'save', ms: 800 },
  { key: 'sync', ms: 1500 },
]

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13l-3 .8.8-3 8.7-8.3Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function Chevron({ up }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"
      style={{ transform: up ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur) var(--ease)' }}
    >
      <path d="M2 4.5 6 8.5l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TickCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SyncIcon() {
  return (
    <svg className="cs-cd-spin" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13.7 2.5v2.4h-2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AnimatedStage({ phase }) {
  const isEditing = phase === 'open' || phase === 'navigate'
  const isCommitted = phase === 'selected' || phase === 'save'
  const value = isCommitted || phase === 'sync' ? TARGET : START
  const highlighted = phase === 'navigate' ? TARGET : START

  if (isEditing || isCommitted) {
    return (
      <div className="cs-cd-editor">
        <div className={`cs-cd-select ${isEditing ? 'is-open' : ''}`}>
          <span className="cs-cd-select-val">{value}</span>
          <span className="cs-cd-select-chev"><Chevron up={isEditing} /></span>
        </div>
        <button
          type="button"
          tabIndex={-1}
          className={`cs-cd-iconbtn cs-cd-save ${isCommitted ? 'is-focus' : ''} ${phase === 'save' ? 'is-press' : ''}`}
        >
          <CheckIcon />
        </button>
        <button type="button" tabIndex={-1} className="cs-cd-iconbtn cs-cd-cancel">
          <XIcon />
        </button>

        {isEditing && (
          <ul className="cs-cd-listbox" role="listbox">
            {OPTIONS.map((opt) => {
              const selected = opt === value
              const active = opt === highlighted
              return (
                <li
                  key={opt}
                  role="option"
                  aria-selected={selected}
                  className={`cs-cd-opt ${selected ? 'is-selected' : ''} ${active ? 'is-active' : ''}`}
                >
                  <span className="cs-cd-opt-check">{selected ? <TickCheck /> : null}</span>
                  <span className="cs-cd-opt-text">{opt}</span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className={`cs-cd-read ${phase === 'focus' ? 'is-focus' : ''}`}>
      <span className="cs-cd-read-text">{value}</span>
      {phase === 'focus' && <span className="cs-cd-read-icon cs-cd-pencil"><PencilIcon /></span>}
      {phase === 'sync' && <span className="cs-cd-read-icon cs-cd-syncmark"><SyncIcon /></span>}
    </div>
  )
}

export default function HeroCellDemo() {
  const [i, setI] = useState(0)
  const timer = useRef(null)

  useEffect(() => {
    timer.current = setTimeout(
      () => setI((n) => (n + 1) % PHASES.length),
      PHASES[i].ms,
    )
    return () => clearTimeout(timer.current)
  }, [i])

  const phase = PHASES[i].key

  return (
    <div className="cs-ht" aria-hidden="true">
      {COLUMNS.map((col) => (
        <div key={col.key} className="cs-ht-col" style={{ width: col.width }}>
          <div className="cs-ht-cell cs-ht-h">{col.key}</div>
          {col.rows.map((val, r) =>
            val === null ? (
              <div key={r} className="cs-ht-cell cs-ht-anim">
                <AnimatedStage phase={phase} />
              </div>
            ) : (
              <div key={r} className="cs-ht-cell">
                <span className="cs-ht-txt">{val}</span>
              </div>
            ),
          )}
        </div>
      ))}
    </div>
  )
}
