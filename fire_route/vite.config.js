import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const MIME_TYPES = {
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

// Returns the (alphabetically first) image file name in a directory, or
// null if there isn't one - shared by the favicon plugin and the icon-folder
// virtual modules below, which both implement a "drop a file in this public/
// folder and it gets picked up" convention instead of a hardcoded filename.
function firstImageIn(dir) {
  const [file] = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && MIME_TYPES[path.extname(entry.name).toLowerCase()])
    .map((entry) => entry.name)
    .sort()
  return file ?? null
}

const FAVICON_DIR = 'icons/website_icon'

// Picks whatever single image sits in public/icons/website_icon/ as the
// favicon, instead of hardcoding a filename in index.html - drop a
// different image in that folder (and remove the old one) to swap the
// favicon with no code changes needed. Runs at both `vite dev` and
// `vite build` time via transformIndexHtml.
function faviconFromFolder() {
  const dir = path.resolve(__dirname, 'public', FAVICON_DIR)

  return {
    name: 'favicon-from-folder',
    transformIndexHtml(html) {
      const file = firstImageIn(dir)
      if (!file) return html

      const type = MIME_TYPES[path.extname(file).toLowerCase()]
      return html.replace(
        /<link rel="icon"[^>]*>/,
        `<link rel="icon" type="${type}" href="/${FAVICON_DIR}/${file}" />`
      )
    },
  }
}

// Exposes `virtual:icon-folder/<name>` modules, each resolving to the public
// URL path (relative, e.g. "icons/navbar_icon/logo.png") of whatever single
// image sits in public/icons/<name>/. Lets JS import an icon without
// hardcoding its filename - components do:
//   import navbarLogo from 'virtual:icon-folder/navbar_icon'
//   const LOGO_SRC = `${import.meta.env.BASE_URL}${navbarLogo}`
// and swapping the file in that folder is all it takes to change it.
function iconFolderModules() {
  const MODULE_PREFIX = 'virtual:icon-folder/'
  const RESOLVED_PREFIX = '\0' + MODULE_PREFIX

  return {
    name: 'icon-folder-modules',
    resolveId(id) {
      if (id.startsWith(MODULE_PREFIX)) return RESOLVED_PREFIX + id.slice(MODULE_PREFIX.length)
    },
    load(id) {
      if (!id.startsWith(RESOLVED_PREFIX)) return

      const folderName = id.slice(RESOLVED_PREFIX.length)
      const dir = path.resolve(__dirname, 'public/icons', folderName)
      const file = firstImageIn(dir)
      if (!file) throw new Error(`No image found in public/icons/${folderName}/`)

      return `export default ${JSON.stringify(`icons/${folderName}/${file}`)}`
    },
  }
}

// Dev-only: keeps the "drop a different file in public/icons/<name>/" swap
// working live while `vite dev` is already running, not just on the next
// fresh build. `public/` is served as a static passthrough and isn't part
// of Vite's watched module graph, and neither faviconFromFolder's
// transformIndexHtml nor iconFolderModules' load() re-runs on its own just
// because a file appeared/disappeared on disk - both only re-read the
// folder when something else triggers them again. Without this, the dev
// server keeps resolving whatever filename it saw the *first* time it
// scanned a folder, even after that file's been deleted and replaced -
// exactly what happened swapping a logo to its WebP version: the page kept
// requesting the old (now-404ing) filename until a manual server restart.
function watchIconFolders() {
  return {
    name: 'watch-icon-folders',
    apply: 'serve',
    configureServer(server) {
      const iconsDir = path.resolve(__dirname, 'public/icons')
      server.watcher.add(iconsDir)
      const onFsEvent = (file) => {
        if (!path.resolve(file).startsWith(iconsDir)) return
        // A browser reload alone re-fetches whatever the virtual module
        // already resolved to - Vite caches that in its own module graph,
        // and nothing marks it stale just because a file changed on disk
        // (the load() hook never registered a watch on it), so the cached
        // filename would keep being served until this is invalidated too.
        for (const mod of server.moduleGraph.idToModuleMap.values()) {
          if (mod.id?.startsWith('\0virtual:icon-folder/')) {
            server.moduleGraph.invalidateModule(mod)
          }
        }
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', onFsEvent)
      server.watcher.on('unlink', onFsEvent)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), faviconFromFolder(), iconFolderModules(), watchIconFolders()],
  base: './',
  build: {
    target: 'es2022',
    cssMinify: 'esbuild',
  },
})
