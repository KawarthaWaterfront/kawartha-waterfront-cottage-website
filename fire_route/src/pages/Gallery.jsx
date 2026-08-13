import { useState, useEffect } from 'react'
import './Gallery.css'

const CDN_BASE = import.meta.env.VITE_CDN_BASE
const JSON_PATH = `${import.meta.env.BASE_URL}images/72-Fire-Rte-98-1.json`

export default function Gallery() {
  const [images, setImages] = useState([])
  const [activeTags, setActiveTags] = useState(new Set())
  const [selectedIdx, setSelectedIdx] = useState(null)

  useEffect(() => {
    fetch(JSON_PATH)
      .then(r => r.json())
      .then(data =>
        setImages(
          data
            // The manifest's first entry is a `categories` lookup (e.g.
            // { categories: { outdoor: 1, indoor: 2 } }), not a photo -
            // skip it rather than trying to render it as one.
            .filter(item => item.filename)
            .map((item, i) => ({
              id: i,
              src: `${CDN_BASE}${item.filename}?v=2`,
              alt: item.filename.replace(/^\d+-/, '').replace(/\.\w+$/, '').replace(/_/g, ' '),
              tags: [item.tag].flat().filter(Boolean),
            }))
        )
      )
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

      <div className="gallery-grid">
        {visible.map((img, i) => (
          <div key={img.id} className="gallery-item" onClick={() => setSelectedIdx(i)}>
            <img src={img.src} alt={img.alt} className="gallery-img" loading="lazy" />
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
