#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

function contentTypeFor(filePath) {
  return MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

// Resolve a request path to a file under rootDir, or null when it escapes the
// doc root or cannot be decoded. A trailing slash means directory -> index.html.
function resolveFile(rootDir, pathname) {
  let decoded
  try {
    decoded = decodeURIComponent(pathname.endsWith('/') ? `${pathname}index.html` : pathname)
  } catch {
    return null
  }
  const absolute = resolve(rootDir, `.${decoded}`)
  if (absolute !== rootDir && !absolute.startsWith(rootDir + sep)) return null
  return absolute
}

// Minimal dependency-free static file server for the built app (`dist/`).
// Public interface: startServer({ root, host, port }) -> Promise<http.Server>
export async function startServer({ root, host, port }) {
  const rootDir = resolve(root)
  const info = await stat(rootDir).catch(() => null)
  if (!info?.isDirectory()) throw new Error(`Doc root not found: ${rootDir}`)

  const server = createServer(async (req, res) => {
    let pathname
    try {
      pathname = new URL(req.url, 'http://localhost').pathname
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Bad request')
      return
    }

    const filePath = resolveFile(rootDir, pathname)

    if (!filePath) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Not found')
      return
    }

    let contents
    try {
      contents = await readFile(filePath)
    } catch (error) {
      const notFound =
        error.code === 'ENOENT' || error.code === 'EISDIR' || error.code === 'ENOTDIR'
      res.writeHead(notFound ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(notFound ? 'Not found' : 'Internal server error')
      return
    }

    res.writeHead(200, { 'Content-Type': contentTypeFor(filePath) })
    res.end(contents)
  })

  return new Promise((resolvePromise, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => resolvePromise(server))
  })
}

// CLI: `node scripts/serve.mjs [root]`, root defaults to dist/. PORT (8080) and
// HOST (0.0.0.0) come from the environment.
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  const root = process.argv[2] ?? 'dist'
  const host = process.env.HOST ?? '0.0.0.0'
  const port = Number(process.env.PORT ?? 8080)

  try {
    await startServer({ root, host, port })
    console.log(`Serving ${root} on http://${host}:${port}`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
