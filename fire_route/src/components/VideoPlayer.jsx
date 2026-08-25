import { useState } from 'react'
import './VideoPlayer.css'

const YOUTUBE_ID = 'kL72RSLUNh8'
const THUMBNAIL_SRC = `${import.meta.env.BASE_URL}images/thumbnail.webp`

export default function VideoPlayer() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="property-video">
      {playing ? (
        <iframe
          className="property-video-frame"
          src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0`}
          title="La Picholine property video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          <img
            src={THUMBNAIL_SRC}
            alt="La Picholine cottage and waterfront"
            className="property-video-poster"
          />
          <div className="property-video-fade" />
          <button
            type="button"
            className="property-video-play"
            onClick={() => setPlaying(true)}
            aria-label="Play video"
          >
            <svg width="28" height="32" viewBox="0 0 28 32" aria-hidden="true">
              <polygon points="0,0 28,16 0,32" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
