import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// aws-rum-web adds real weight to the JS payload (~85KB gzip) - loading it
// eagerly here would tax every single page's critical rendering path just
// to send analytics. Deferred to its own chunk, fetched once the browser
// is idle (after first paint), rather than statically imported. This
// doesn't lose any load-timing accuracy: the browser buffers Navigation
// and Resource Timing entries itself, and AWS RUM's "performance"
// telemetry reads from that buffer - it can see the full page-load
// timeline retroactively regardless of when the client actually boots.
const scheduleIdle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1))
scheduleIdle(() => {
  import('./rum.js')
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
