import { useState, useEffect } from 'react'
import { preconnect } from 'react-dom'
import { motion, LayoutGroup, AnimatePresence } from 'motion/react'
import './Gallery.css'

// Shared spring-ish easing for every layout/shared-element transition below,
// matching the cubic-bezier already used for the sidebar elsewhere in the
// app rather than Motion's (bouncier) default spring.
const EXPAND_TRANSITION = { duration: 0.45, ease: [0.4, 0, 0.2, 1] }

const CDN_BASE = import.meta.env.VITE_CDN_BASE
const JSON_PATH = `${import.meta.env.BASE_URL}images/72-Fire-Rte-98-1.json`

// wsrv.nl (formerly images.weserv.nl) is a free, public image proxy: given
// a source URL it fetches, resizes, and re-encodes the image on the fly and
// caches the result at its edge. No API key/account needed. Used only for
// the grid thumbnails, which are rendered small - the lightbox still loads
// `img.src` (the real CDN URL) directly at full resolution, unproxied and
// uncompressed, since that's the actual photo the click is for.
const THUMB_PROXY_BASE = 'https://wsrv.nl/'
const THUMB_WIDTH = 800
// The fan of (up to 3) preview photos on a collapsed category card renders
// each one at well under 200px - on first load, every collapsed card on
// the page requests its preview photos at once (up to 3 x however many
// categories there are), so fetching the same 800px-wide image that size
// just for a tiny preview meaningfully bloats the page's initial payload,
// which is what's actually slow to arrive on a throttled connection.
const PREVIEW_THUMB_WIDTH = 240

function thumbSrc(originalSrc, width = THUMB_WIDTH) {
  const params = new URLSearchParams({
    url: originalSrc,
    w: width,
    output: 'webp',
    q: '75',
  })
  return `${THUMB_PROXY_BASE}?${params}`
}

// How fast the page scrolls back to the top when expanding/collapsing a
// category, in pixels per second - separate knobs since the "right" speed
// tends to differ by screen size (a long scroll on a narrow phone doesn't
// necessarily want the same pace as a short one on a wide desktop). Native
// `scrollTo({ behavior: 'smooth' })` doesn't expose any way to control its
// speed/duration at all, hence rolling a small custom scroll animation
// below instead of using it.
const SCROLL_SPEED_DESKTOP_PX_PER_SEC = 6000
const SCROLL_SPEED_MOBILE_PX_PER_SEC = 3000
// Matches the max-width the rest of the app already treats as the
// mobile/desktop split (see Navbar.css).
const MOBILE_BREAKPOINT_PX = 768

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

// Animates the page's scroll position from wherever it currently is up to
// the very top, at a speed (not a fixed duration) so a long scroll and a
// short one feel equally fast rather than a short one feeling sluggish or
// a long one feeling rushed. Calls `onDone` once it actually reaches 0 -
// used to know precisely when it's safe to release the height-pin in
// `scrollToTopAndToggle` below, rather than guessing with a timeout.
function scrollToTopAtSpeed(onDone) {
  const startY = window.scrollY
  if (startY <= 0) {
    onDone()
    return
  }

  const speed = window.innerWidth <= MOBILE_BREAKPOINT_PX
    ? SCROLL_SPEED_MOBILE_PX_PER_SEC
    : SCROLL_SPEED_DESKTOP_PX_PER_SEC
  const durationMs = (startY / speed) * 1000
  // Captured from the first rAF callback's own timestamp, not from calling
  // performance.now() before scheduling it - if that first callback is
  // delayed (a backgrounded tab, a busy main thread, mobile throttling),
  // measuring elapsed time against a start captured too early makes `t`
  // land past 1 on that very first frame, so the "animation" is really
  // just an instant jump instead of running at the configured speed.
  let startTime = null

  function step(now) {
    if (startTime === null) startTime = now
    const t = Math.min((now - startTime) / durationMs, 1)
    window.scrollTo(0, startY * (1 - easeInOutCubic(t)))
    if (t < 1) requestAnimationFrame(step)
    else onDone()
  }
  requestAnimationFrame(step)
}

// Deterministic pseudo-random fan angle for a collapsed group's preview
// photos, seeded by each photo's own id - "random" scatter, but stable
// across re-renders (a tag toggle or hover shouldn't reshuffle the layout).
// Returned as a plain degree number for Motion's `style.rotate` rather than
// a CSS custom property feeding a stylesheet `transform:` rule - a raw CSS
// `transform` on a `layout`/`layoutId` element fights Motion for control of
// that property (each undoing the other once the layout animation settles),
// which showed up as the front fan photo visibly re-rotating/rescaling a
// moment after the card had already finished its move. Motion composes
// `rotate`/`scale` style values with its own layout projection correctly,
// so there's nothing left to fight over.
function scatterRotation(seed) {
  const hash = (n) => {
    const x = Math.sin(n * 999.7) * 43758.5453
    return x - Math.floor(x)
  }
  return (hash(seed) - 0.5) * 12 // -6..6deg
}

export default function Gallery() {
  // Opens the connection (DNS lookup + TCP + TLS handshake) to both the
  // CloudFront distribution and the thumbnail proxy as soon as this page
  // renders, instead of waiting for the manifest fetch to resolve and the
  // first <img src> to be discovered - shaves that handshake latency off
  // the first photo that loads. React hoists these into deduped
  // <link rel="preconnect"> tags in <head>; calling them on every render is
  // the intended usage (react-dom dedupes identical calls itself).
  preconnect(CDN_BASE)
  preconnect(THUMB_PROXY_BASE)

  const [images, setImages] = useState([])
  const [categoryOrder, setCategoryOrder] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState(new Set())

  const toggleCategory = (key) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // Both directions move the clicked category to/from the top of the page
  // (expanded sections always render first), so both need the page
  // scrolled to the very top - expanding while scrolled down left the
  // newly-expanded photos off-screen above the viewport, and collapsing
  // while scrolled deep into a large category (e.g. 25 photos) used to
  // jump/snap the page, since the collapsed card is far shorter and sits
  // back at the top, leaving the scroll position pointing at content that
  // no longer existed.
  //
  // Motion's layout animations reflow the real DOM to its final size the
  // instant React commits the state change - what visibly grows/shrinks
  // over the next 450ms is just a transform faking the transition on top
  // of a box that's already the new size. Waiting for the scroll to fully
  // finish before ever calling toggleCategory avoided the snap, but made
  // the toggle feel sluggish - nothing visibly happened until scrolling
  // was done.
  //
  // Pinning the document to its current height for the duration of the
  // scroll instead gives it somewhere real to land, so the toggle can
  // start immediately and run *concurrently* with the scroll - it's the
  // scrollable area's height changing out from under an in-progress
  // scroll that caused the snap/cut-off, not the timing of the visual
  // animation itself. The pin is released once `scrollToTopAtSpeed`
  // reports it has actually reached 0, not a guess at how long that'll
  // take - a guess that's too short releases the pin, and therefore the
  // scrollable room, before a long scroll (e.g. from far down the page, or
  // a slower mobile browser) has actually finished, which is what "doesn't
  // fully scroll up" was.
  const scrollToTopAndToggle = (key) => {
    document.body.style.minHeight = `${document.documentElement.scrollHeight}px`
    scrollToTopAtSpeed(() => {
      document.body.style.minHeight = ''
    })
    toggleCategory(key)
  }

  useEffect(() => {
    fetch(JSON_PATH)
      .then(r => r.json())
      .then(data => {
        // The manifest's first entry is a `categories` lookup (e.g.
        // { categories: { outdoor: 1, indoor: 2 } }), not a photo - read the
        // display order out of it (lowest id first), then skip it below
        // rather than trying to render it as one.
        const header = data.find(item => item.categories)
        setCategoryOrder(
          header
            ? Object.entries(header.categories).sort((a, b) => a[1] - b[1]).map(([name]) => name)
            : []
        )

        setImages(
          data
            .filter(item => item.filename)
            // `image-order` defines display order within a category (and,
            // since sections filter this already-sorted list, that order
            // carries straight through to each section's items). Missing
            // values sort last rather than colliding at 0.
            .sort((a, b) => (a['image-order'] ?? Infinity) - (b['image-order'] ?? Infinity))
            .map((item, i) => {
              const src = `${CDN_BASE}${item.filename}?v=2`
              return {
                id: i,
                src,
                thumb: thumbSrc(src),
                previewThumb: thumbSrc(src, PREVIEW_THUMB_WIDTH),
                alt: item.filename.replace(/^\d+-/, '').replace(/\.\w+$/, '').replace(/_/g, ' '),
                category: item.category ?? null,
              }
            })
        )
      })
  }, [])

  useEffect(() => {
    if (selectedIdx === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedIdx(null)
      if (e.key === 'ArrowRight') setSelectedIdx(i => (i + 1) % visible.length)
      if (e.key === 'ArrowLeft') setSelectedIdx(i => (i - 1 + visible.length) % visible.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedIdx])

  const hasCategories = images.some(img => img.category)

  // The full list of filter buttons - every category value actually used by
  // a photo, declared ones (from the manifest's `categories` header) first
  // in their declared order, then any others found in the data that aren't
  // declared. Derived from `images` (not `visible`) so the button list
  // itself doesn't shrink once a filter narrows `visible`.
  const presentCategories = new Set(images.map(img => img.category).filter(Boolean))
  const categoryList = [
    ...categoryOrder.filter(c => presentCategories.has(c)),
    ...Array.from(presentCategories).filter(c => !categoryOrder.includes(c)),
  ]

  const visible = activeCategory ? images.filter(img => img.category === activeCategory) : images

  // Splits `visible` into per-category groups for the collapsible-card
  // display, while keeping each image's index into `visible` attached - the
  // lightbox's prev/next still cycles the same flat `visible` array/order,
  // this only changes how the grid is laid out on the page. Only used for
  // the "All" view - picking a specific category filter already narrows
  // `visible` to one category, so that view skips straight to a flat grid
  // instead of showing a single collapsible card for it.
  const sections = hasCategories
    ? [...categoryOrder, ...Array.from(presentCategories).filter(c => !categoryOrder.includes(c)), null]
        .map(category => ({
          category,
          key: category ?? 'uncategorized',
          label: category ? category[0].toUpperCase() + category.slice(1) : 'Other',
          items: visible
            .map((img, i) => ({ img, i }))
            .filter(({ img }) => img.category === category),
        }))
        .filter(section => section.items.length > 0)
    : [{ category: null, key: 'uncategorized', label: null, items: visible.map((img, i) => ({ img, i })) }]

  // Whichever group(s) are expanded always float to the top - collapsed
  // groups move below them regardless of their original category order, so
  // clicking a card always shifts every other (still-collapsed) card down,
  // not just the ones that came after it.
  const expandedSections = sections.filter(s => !hasCategories || expandedCategories.has(s.key))
  const collapsedSections = hasCategories ? sections.filter(s => !expandedCategories.has(s.key)) : []

  return (
    <div className="layout-wrap gallery-page">
      <h1 className="gallery-heading">Photo Gallery</h1>

      {hasCategories && (
        <div className="gallery-filters">
          <button
            className={`filter-btn${activeCategory === null ? ' filter-btn--active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            All
          </button>
          {categoryList.map(cat => (
            <button
              key={cat}
              className={`filter-btn${activeCategory === cat ? ' filter-btn--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat[0].toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Expanded groups render first (each its own full-width block), so
          clicking a card always brings its photos to the top - collapsed
          groups always render after, together in one shared grid, so they
          shift down regardless of where they sat in the original category
          order relative to the one that got clicked.

          The clicked card's own animation comes from `layoutId`: the
          collapsed stack button and the expanded wrapper below share
          `card-${key}`, and each of the (up to 3) photos visible in the
          stack's fan shares `photo-${img.id}` with its counterpart in the
          full grid. Since only one side of each pair is ever mounted at a
          time, Motion treats the pair as the same element and animates a
          smooth resize/move between their two positions instead of an
          instant swap - the card visibly grows and slides to the top, and
          those specific photos visibly expand out of the fan into their
          grid slots.

          `layoutId` lives on the .gallery-item/.gallery-stack-card box
          itself, not the <img> inside it - nesting a second, independently
          `layoutId`'d motion element inside an already-`layout`-animating
          parent made the two compete over the same frames (their FLIP
          interpolations drift out of sync), which read as the image
          content lagging behind its own rounded-corner outline before
          snapping into place. A single animating node per photo, with a
          plain <img> passively filling it, avoids that entirely.

          Photos beyond the first 3 have no on-screen predecessor to morph
          from, so instead they burst outward from a small centered scale
          on expand - and, wrapped in AnimatePresence, shrink back down the
          same way on collapse instead of just vanishing.

          All of this only applies to the "All" view - picking a specific
          category filter already narrows `visible` to one category, so
          there's nothing left to collapse; that view is just a flat grid
          below instead. */}
      {activeCategory !== null ? (
        <div className="gallery-grid">
          {visible.map((img, i) => (
            <div key={img.id} className="gallery-item" onClick={() => setSelectedIdx(i)}>
              <img src={img.thumb} alt={img.alt} className="gallery-img" loading="lazy" />
            </div>
          ))}
        </div>
      ) : (
      <LayoutGroup>
        <AnimatePresence mode="popLayout">
          {expandedSections.map(({ key, label, items }) => (
            <motion.div className="gallery-category-expanded" key={key} layout layoutId={`card-${key}`} transition={EXPAND_TRANSITION}>
              {hasCategories && (
                <motion.button
                  type="button"
                  className="gallery-category-toggle"
                  onClick={() => scrollToTopAndToggle(key)}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={EXPAND_TRANSITION}
                >
                  <h2 className="gallery-category-heading">{label}</h2>
                  <svg
                    className="gallery-stack-chevron gallery-stack-chevron--open"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </motion.button>
              )}
              <div className="gallery-grid">
                <AnimatePresence mode="popLayout">
                  {items.map(({ img, i }, idx) => {
                    const shared = idx < 3
                    return (
                      <motion.div
                        key={img.id}
                        className="gallery-item"
                        layout
                        layoutId={shared ? `photo-${img.id}` : undefined}
                        transition={shared ? EXPAND_TRANSITION : { ...EXPAND_TRANSITION, delay: Math.min((idx - 3) * 0.03, 0.3) }}
                        initial={shared ? false : { opacity: 0, scale: 0.4 }}
                        animate={shared ? undefined : { opacity: 1, scale: 1 }}
                        exit={shared ? undefined : { opacity: 0, scale: 0.4 }}
                        onClick={() => setSelectedIdx(i)}
                      >
                        <img src={img.thumb} alt={img.alt} className="gallery-img" loading="lazy" />
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
              {hasCategories && (
                <button type="button" className="gallery-collapse-btn" onClick={() => scrollToTopAndToggle(key)}>
                  <svg
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  Collapse
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {collapsedSections.length > 0 && (
          <div className={`gallery-grid${expandedSections.length > 0 ? ' gallery-collapsed-grid' : ''}`}>
            {collapsedSections.map(({ key, label, items }) => (
              <motion.button
                key={key}
                type="button"
                className="gallery-item gallery-stack-card"
                layout
                layoutId={`card-${key}`}
                transition={EXPAND_TRANSITION}
                onClick={() => scrollToTopAndToggle(key)}
                aria-expanded={false}
              >
                <div className="gallery-stack-preview">
                  {items.slice(0, 3).map(({ img }, idx) => (
                    <motion.div
                      key={img.id}
                      className="gallery-stack-photo"
                      layout
                      layoutId={`photo-${img.id}`}
                      transition={EXPAND_TRANSITION}
                      style={{ rotate: scatterRotation(img.id), scale: 1.12 }}
                      whileHover={idx === 0 ? { scale: 1.18 } : undefined}
                    >
                      <img src={img.previewThumb} alt="" loading="lazy" />
                    </motion.div>
                  ))}
                </div>
                <div className="gallery-stack-overlay">
                  <span className="gallery-stack-label">{label}</span>
                  <span className="gallery-stack-count">
                    {items.length} photo{items.length === 1 ? '' : 's'}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </LayoutGroup>
      )}

      {selectedIdx !== null && (() => {
        const img = visible[selectedIdx]
        const prev = () => setSelectedIdx(i => (i - 1 + visible.length) % visible.length)
        const next = () => setSelectedIdx(i => (i + 1) % visible.length)
        return (
          <div className="lightbox-overlay" onClick={() => setSelectedIdx(null)}>
            <button className="lightbox-close" onClick={() => setSelectedIdx(null)} aria-label="Close">✕</button>
            <button className="lightbox-prev" onClick={(e) => { e.stopPropagation(); prev() }} aria-label="Previous">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <img
              src={img.src}
              alt={img.alt}
              className="lightbox-img"
              onClick={(e) => e.stopPropagation()}
            />
            <button className="lightbox-next" onClick={(e) => { e.stopPropagation(); next() }} aria-label="Next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        )
      })()}
    </div>
  )
}
