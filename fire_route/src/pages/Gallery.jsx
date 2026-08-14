import { useState, useEffect } from 'react'
import { preconnect } from 'react-dom'
import './Gallery.css'

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

function thumbSrc(originalSrc) {
  const params = new URLSearchParams({
    url: originalSrc,
    w: THUMB_WIDTH,
    output: 'webp',
    q: '75',
  })
  return `${THUMB_PROXY_BASE}?${params}`
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
  const [activeTags, setActiveTags] = useState(new Set())
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState(new Set())

  const toggleCategory = (key) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
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
            .map((item, i) => {
              const src = `${CDN_BASE}${item.filename}?v=2`
              return {
                id: i,
                src,
                thumb: thumbSrc(src),
                alt: item.filename.replace(/^\d+-/, '').replace(/\.\w+$/, '').replace(/_/g, ' '),
                tags: [item.tag].flat().filter(Boolean),
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

  const allTags = Array.from(new Set(images.flatMap(img => img.tags)))
  const hasTags = allTags.length > 0

  const toggleTag = (tag) => {
    if (tag === 'All') {
      setActiveTags(new Set())
      return
    }
    setActiveTags(prev => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  const visible =
    !hasTags || activeTags.size === 0
      ? images
      : images.filter(img => img.tags.some(t => activeTags.has(t)))

  // Splits the (already tag-filtered) flat list into per-category groups for
  // display, while keeping each image's index into `visible` attached - the
  // lightbox's prev/next still cycles the same flat `visible` array/order,
  // this only changes how the grid is laid out on the page.
  const hasCategories = images.some(img => img.category)
  const extraCategories = Array.from(
    new Set(visible.map(img => img.category).filter(cat => cat && !categoryOrder.includes(cat)))
  )
  const sections = hasCategories
    ? [...categoryOrder, ...extraCategories, null]
        .map(category => ({
          category,
          items: visible
            .map((img, i) => ({ img, i }))
            .filter(({ img }) => img.category === category),
        }))
        .filter(section => section.items.length > 0)
    : [{ category: null, items: visible.map((img, i) => ({ img, i })) }]

  return (
    <div className="layout-wrap gallery-page">
      <h1 className="gallery-heading">Photo Gallery</h1>

      {hasTags && (
        <div className="gallery-filters">
          {['All', ...allTags].map(tag => (
            <button
              key={tag}
              className={`filter-btn${
                tag === 'All'
                  ? activeTags.size === 0 ? ' filter-btn--active' : ''
                  : activeTags.has(tag) ? ' filter-btn--active' : ''
              }`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {sections.map(({ category, items }) => {
        const key = category ?? 'uncategorized'
        const label = category ? category[0].toUpperCase() + category.slice(1) : 'Other'
        // Groups start collapsed into a single stacked "card" spanning the
        // row; clicking it swaps the stack for the same grid the page used
        // to always show. Skip the stack entirely when there's no real
        // grouping (hasCategories false) - a single ungrouped section just
        // renders its grid directly, like before.
        const isExpanded = !hasCategories || expandedCategories.has(key)

        return (
          <section className="gallery-category-section" key={key}>
            {hasCategories && (
              <button
                type="button"
                className="gallery-stack-card"
                onClick={() => toggleCategory(key)}
                aria-expanded={isExpanded}
              >
                <div className="gallery-stack-preview">
                  {items.slice(0, 3).map(({ img }) => (
                    <img key={img.id} src={img.thumb} alt="" loading="lazy" />
                  ))}
                </div>
                <div className="gallery-stack-info">
                  <h2 className="gallery-category-heading">{label}</h2>
                  <span className="gallery-stack-count">
                    {items.length} photo{items.length === 1 ? '' : 's'}
                  </span>
                </div>
                <svg
                  className={`gallery-stack-chevron${isExpanded ? ' gallery-stack-chevron--open' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}
            {isExpanded && (
              <div className="gallery-grid">
                {items.map(({ img, i }) => (
                  <div key={img.id} className="gallery-item" onClick={() => setSelectedIdx(i)}>
                    <img src={img.thumb} alt={img.alt} className="gallery-img" loading="lazy" />
                    {img.tags.length > 0 && (
                      <div className="gallery-tags">
                        {img.tags.map(t => (
                          <span key={t} className="gallery-tag" onClick={(e) => { e.stopPropagation(); toggleTag(t) }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })}

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
