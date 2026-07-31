import { useState, useEffect, useRef, useCallback } from 'react'
import './Carousel.css'

const REVIEWS_JSON = `${import.meta.env.BASE_URL}reviews.json`
const INTERVAL_MS = 6000
const TRANSITION_MS = 700
const AUTO_SCROLL_SPEED_PX = 0.5
const AUTO_SCROLL_TICK_MS = 30
const AUTO_SCROLL_RESUME_DELAY_MS = 1000

// offset: 0=center, ±1=adjacent, ±2=far, ±3+=exiting
function slideStyle(offset) {
  const abs = Math.abs(offset)
  const sign = Math.sign(offset)
  const levels = [
    { x: 0,   scale: 1.00, opacity: 1.00 },
    { x: 78,  scale: 0.83, opacity: 0.75 },
    { x: 150, scale: 0.68, opacity: 0.35 },
    { x: 210, scale: 0.55, opacity: 0.00 },
  ]
  const c = levels[Math.min(abs, levels.length - 1)]
  return {
    transform: `translateX(${sign * c.x}%) translateY(calc(var(--card-hover-lift, 0px) * -1)) scale(calc(var(--card-hover-scale, 1) * ${c.scale}))`,
    opacity: c.opacity,
    zIndex: 10 - abs,
  }
}

function mod(n, m) {
  return ((n % m) + m) % m
}

// Some sources' raw review text contains literal <br>/<br/> tags - since the
// text is rendered as plain text (not HTML), stripping them here avoids the
// tags showing up verbatim in the card.
function stripBreakTags(text) {
  if (!text) return text
  return text.replace(/<br\s*\/?>/gi, ' ').replace(/\s+/g, ' ').trim()
}

const SOURCE_LABELS = {
  cottagesincanada: 'Cottages in Canada',
  airbnb: 'Airbnb',
  vrbo: 'Vrbo',
}

// reviews.json's top-level `sources` is a flat list of listing URLs (one per
// scraper source), not keyed by source name - match each URL to the source
// whose reviews it hosts so the expanded card can link out to it.
function mapSourceUrls(urls) {
  const map = {}
  for (const url of urls ?? []) {
    if (url.includes('cottagesincanada')) map.cottagesincanada = url
    else if (url.includes('airbnb')) map.airbnb = url
    else if (url.includes('vrbo')) map.vrbo = url
  }
  return map
}

function Stars({ rating }) {
  const filled = Math.round(rating || 0)
  return (
    <div className="carousel-card-rating" aria-label={`${rating} out of 5 stars`}>
      <span className="carousel-card-rating-number">{rating?.toFixed(1)}</span>
      <div className="carousel-card-stars">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < filled ? 'star star--filled' : 'star'}>★</span>
        ))}
      </div>
    </div>
  )
}

export default function Carousel({ showRatings = true }) {
  const [reviews, setReviews] = useState([])
  const [sourceUrls, setSourceUrls] = useState({})
  const [cards, setCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [expandedKey, setExpandedKey] = useState(null)
  const keyRef = useRef(0)
  const centerIndexRef = useRef(0)
  const directionRef = useRef(1)
  const animatingRef = useRef(false)
  const textRefs = useRef(new Map())
  const pauseOwnerRef = useRef(null)
  const expandedKeyRef = useRef(null)
  const frontKeyRef = useRef(null)
  const trackRef = useRef(null)
  const draggingRef = useRef(false)
  expandedKeyRef.current = expandedKey
  const frontCard = cards.find(c => c.offset === 0)
  frontKeyRef.current = frontCard && frontCard.key !== expandedKey ? frontCard.key : null
  const expandedReview = cards.find(c => c.key === expandedKey)?.review

  useEffect(() => {
    fetch(REVIEWS_JSON)
      .then(r => r.json())
      .then(data => {
        const cleaned = (data.reviews ?? [])
          .filter(r => r.include !== false)
          .map(r => ({ ...r, text: stripBreakTags(r.text) }))
        setReviews(cleaned)
        setSourceUrls(mapSourceUrls(data.sources))
      })
  }, [])

  useEffect(() => {
    if (!reviews.length) return
    centerIndexRef.current = 2 % reviews.length
    setCurrentIndex(centerIndexRef.current)
    setCards(
      [-2, -1, 0, 1, 2].map((offset, i) => ({
        key: keyRef.current++,
        review: reviews[i % reviews.length],
        offset,
      }))
    )
  }, [reviews])

  // Shifts every card by one slot in `dir` (1 = forward, -1 = backward) and
  // brings in the next review at the far edge on that side.
  const step = useCallback((dir) => {
    if (!reviews.length) return
    const n = reviews.length
    const enteringOffset = dir * 2
    const enteringIndex = mod(centerIndexRef.current + dir + enteringOffset, n)
    const newReview = reviews[enteringIndex]
    const newKey = keyRef.current++

    animatingRef.current = true
    centerIndexRef.current = mod(centerIndexRef.current + dir, n)
    setCurrentIndex(centerIndexRef.current)
    setCards(prev => [
      ...prev.map(c => ({ ...c, offset: c.offset - dir })),
      { key: newKey, review: newReview, offset: enteringOffset },
    ])
    setTimeout(() => {
      setCards(prev => prev.filter(c => Math.abs(c.offset) <= 2))
      animatingRef.current = false
    }, TRANSITION_MS + 50)
  }, [reviews])

  useEffect(() => {
    if (!reviews.length || paused) return
    const t = setInterval(() => step(directionRef.current), INTERVAL_MS)
    return () => clearInterval(t)
  }, [reviews, paused, step])

  function handleClose() {
    setExpandedKey(null)
    setPaused(false)
  }

  function handleCardClick(card) {
    if (animatingRef.current) return

    if (expandedKey === card.key) {
      handleClose()
    } else {
      setExpandedKey(card.key)
      setPaused(true)
    }
  }

  function handleNav(dir) {
    if (animatingRef.current) return

    setExpandedKey(null)
    directionRef.current = dir
    setPaused(true)
    step(dir)
    setTimeout(() => setPaused(false), TRANSITION_MS + 50)
  }

  // Rebuilds the deck centered on an arbitrary index rather than reusing
  // `step()`'s one-slot shift-and-slide - scrubbing can jump many reviews at
  // once, and every card gets a fresh key here so it mounts directly at its
  // new position instead of animating across all the skipped slots.
  const goToIndex = useCallback((idx) => {
    if (!reviews.length) return
    const n = reviews.length
    const target = mod(idx, n)
    if (target === centerIndexRef.current) return
    centerIndexRef.current = target
    setCurrentIndex(target)
    setCards(
      [-2, -1, 0, 1, 2].map(offset => ({
        key: keyRef.current++,
        review: reviews[mod(target + offset, n)],
        offset,
      }))
    )
  }, [reviews])

  const scrubToClientX = useCallback((clientX) => {
    const track = trackRef.current
    if (!track || !reviews.length) return
    const rect = track.getBoundingClientRect()
    const fraction = rect.width > 0 ? (clientX - rect.left) / rect.width : 0
    const clamped = Math.min(1, Math.max(0, fraction))
    goToIndex(Math.round(clamped * (reviews.length - 1)))
  }, [reviews, goToIndex])

  function handleTrackPointerDown(e) {
    if (animatingRef.current) return
    draggingRef.current = true
    setExpandedKey(null)
    setPaused(true)
    e.target.setPointerCapture(e.pointerId)
    scrubToClientX(e.clientX)
  }

  function handleTrackPointerMove(e) {
    if (!draggingRef.current) return
    scrubToClientX(e.clientX)
  }

  function handleTrackPointerUp() {
    if (!draggingRef.current) return
    draggingRef.current = false
    setPaused(false)
  }

  function handleTrackKeyDown(e) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      goToIndex(centerIndexRef.current + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goToIndex(centerIndexRef.current - 1)
    }
  }

  // Drives the front review's auto-scroll and the carousel's read-time
  // pause from a single always-running ticker, rather than reacting to
  // React ref mount/unmount events. Refs (and the effects tied to them)
  // can be detached and reattached by React independently of whether the
  // front card actually changed, which previously reset progress and
  // re-armed the pause every time — the carousel never advanced because
  // `paused` never stayed false long enough for the slide timer to fire.
  // Polling `frontKeyRef`/`textRefs` each tick side-steps that entirely.
  useEffect(() => {
    let holdUntil = null
    let lastKey = null
    // Tracked separately from el.scrollTop because Firefox rounds fractional
    // scrollTop assignments down to the nearest integer on read-back — since
    // AUTO_SCROLL_SPEED_PX is 0.5, deriving `next` from el.scrollTop directly
    // got stuck reassigning 0.5 -> reads back as 0 -> 0 + 0.5 = 0.5 forever.
    // A local float accumulator crosses integer boundaries regardless of how
    // the browser rounds what's actually painted.
    let progress = 0

    const tick = () => {
      const key = frontKeyRef.current

      if (key !== lastKey) {
        if (lastKey !== null) {
          const prevEl = textRefs.current.get(lastKey)
          if (prevEl) {
            prevEl.scrollTop = 0
            prevEl.classList.remove('carousel-card-text--at-end')
          }
          if (pauseOwnerRef.current === lastKey) pauseOwnerRef.current = null
        }
        lastKey = key
        holdUntil = null
        progress = 0
      }

      if (key === null) return
      const el = textRefs.current.get(key)
      if (!el) return
      const maxScroll = el.scrollHeight - el.clientHeight
      if (maxScroll <= 1) {
        // Nothing to scroll to reveal, so the bottom fade would only ever
        // obscure real content — never show it for reviews that already fit.
        el.classList.add('carousel-card-text--at-end')
        return
      }

      if (holdUntil === null) {
        if (pauseOwnerRef.current !== key) {
          pauseOwnerRef.current = key
          setPaused(true)
        }
        progress += AUTO_SCROLL_SPEED_PX
        if (progress >= maxScroll) {
          el.scrollTop = maxScroll
          el.classList.add('carousel-card-text--at-end')
          holdUntil = Date.now() + AUTO_SCROLL_RESUME_DELAY_MS
        } else {
          el.scrollTop = progress
        }
      } else if (holdUntil !== Infinity && Date.now() >= holdUntil) {
        if (pauseOwnerRef.current === key) {
          pauseOwnerRef.current = null
          if (expandedKeyRef.current === null) setPaused(false)
        }
        holdUntil = Infinity
      }
    }

    const timer = setInterval(tick, AUTO_SCROLL_TICK_MS)
    return () => clearInterval(timer)
  }, [])

  if (!cards.length) return null

  return (
    <section className="carousel">
      <h2>What Our Guests Say</h2>
      <div className="carousel-stage-wrap">
        <div className="carousel-stage">
          {cards.map(card => {
            const isFront = card.offset === 0
            return (
              <div
                key={card.key}
                className={`carousel-card${isFront ? ' carousel-card--front' : ''}`}
                style={slideStyle(card.offset)}
                onClick={isFront ? () => handleCardClick(card) : undefined}
              >
                {showRatings && <Stars rating={card.review.rating} />}
                <p
                  ref={(el) => {
                    if (el) textRefs.current.set(card.key, el)
                    else textRefs.current.delete(card.key)
                  }}
                  className="carousel-card-text"
                >
                  {card.review.text}
                </p>
                <p className="carousel-card-author">
                  {card.review.author}
                  {card.review.date && <span className="carousel-card-date"> · {card.review.date}</span>}
                </p>
                {sourceUrls[card.review.source] && (
                  <a
                    className="carousel-source-link"
                    href={sourceUrls[card.review.source]}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View on {SOURCE_LABELS[card.review.source] ?? card.review.source}
                  </a>
                )}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          className="carousel-arrow carousel-arrow--prev"
          onClick={() => handleNav(-1)}
          aria-label="Previous review"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          className="carousel-arrow carousel-arrow--next"
          onClick={() => handleNav(1)}
          aria-label="Next review"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      </div>
      <div className="carousel-progress">
        <span className="carousel-progress-number">
          {currentIndex + 1} / {reviews.length}
        </span>
        <div
          ref={trackRef}
          className="carousel-progress-track"
          role="slider"
          aria-label="Review progress"
          aria-valuemin={1}
          aria-valuemax={reviews.length}
          aria-valuenow={currentIndex + 1}
          tabIndex={0}
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={handleTrackPointerUp}
          onPointerCancel={handleTrackPointerUp}
          onKeyDown={handleTrackKeyDown}
        >
          <div
            className="carousel-progress-fill"
            style={{ width: `${((currentIndex + 1) / reviews.length) * 100}%` }}
          />
        </div>
      </div>
      {expandedReview && (
        <div className="carousel-overlay" onClick={handleClose}>
          <div className="carousel-expanded-card" onClick={(e) => e.stopPropagation()}>
            <button className="carousel-close-btn" onClick={handleClose} aria-label="Close">×</button>
            {showRatings && <Stars rating={expandedReview.rating} />}
            <p className="carousel-expanded-text">{expandedReview.text}</p>
            <p className="carousel-card-author">
              {expandedReview.author}
              {expandedReview.date && <span className="carousel-card-date"> · {expandedReview.date}</span>}
            </p>
            {sourceUrls[expandedReview.source] && (
              <a
                className="carousel-source-link"
                href={sourceUrls[expandedReview.source]}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on {SOURCE_LABELS[expandedReview.source] ?? expandedReview.source}
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
