import { useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// ScenarioCarousel
// A lightweight, dependency-free image carousel that previews the extracted
// scenario screenshots (public/screenshots/<path>.png). It gives visitors a
// quick read on "the kind of work" the live prototypes contain. `items` is an
// ordered list of { path, title, family, role }; the image src is derived from
// the path. Auto-advances, pausing on hover/focus and for reduced-motion.
// ---------------------------------------------------------------------------
const AUTOPLAY_MS = 5000

function shotSrc(path) {
  return `${import.meta.env.BASE_URL}screenshots/${path}.png`
}

export default function ScenarioCarousel({ items }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = items.length

  const go = (next) => setIndex(((next % count) + count) % count)
  const prev = () => go(index - 1)
  const next = () => go(index + 1)

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
    }
  }

  // Auto-advance. Re-runs when `index` changes so the interval resets after any
  // manual navigation, keeping a steady cadence. Skipped while paused, for a
  // single slide, or when the user prefers reduced motion.
  useEffect(() => {
    if (paused || count <= 1) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [paused, count, index])

  if (count === 0) return null
  const active = items[index]

  return (
    <div
      className="cs-carousel"
      role="group"
      aria-roledescription="carousel"
      aria-label="Prototype previews"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="cs-carousel-stage">
        <button
          type="button"
          className="cs-carousel-arrow cs-carousel-arrow--prev"
          aria-label="Previous prototype"
          onClick={prev}
        >
          ‹
        </button>

        <div className="cs-carousel-viewport">
          {items.map((item, i) => (
            <figure
              className={`cs-carousel-slide ${i === index ? 'is-active' : ''}`}
              key={item.path}
              aria-hidden={i !== index}
            >
              <img
                className="cs-carousel-shot"
                src={shotSrc(item.path)}
                alt={`${item.title} prototype`}
                draggable="false"
              />
            </figure>
          ))}
        </div>

        <button
          type="button"
          className="cs-carousel-arrow cs-carousel-arrow--next"
          aria-label="Next prototype"
          onClick={next}
        >
          ›
        </button>
      </div>

      <div className="cs-carousel-caption">
        <span className="cs-carousel-family t-eyebrow-strong">{active.family}</span>
        <h3 className="cs-carousel-title t-h4">{active.title}</h3>
        <p className="cs-carousel-role t-body-sm">{active.role}</p>
      </div>

      <div className="cs-carousel-nav" role="tablist" aria-label="Choose prototype">
        {items.map((item, i) => (
          <button
            key={item.path}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={item.title}
            className={`cs-carousel-dot ${i === index ? 'is-active' : ''}`}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  )
}
