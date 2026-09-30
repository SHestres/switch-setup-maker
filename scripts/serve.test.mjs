// @vitest-environment node
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { connect } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { afterEach, expect, test } from 'vitest'

import { startServer } from './serve.mjs'

const servers = []
const dirs = []

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise((done) => server.close(done))))
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

async function makeDocRoot(files) {
  const root = await mkdtemp(join(tmpdir(), 'ssm-serve-'))
  dirs.push(root)
  for (const [name, contents] of Object.entries(files)) {
    await mkdir(dirname(join(root, name)), { recursive: true })
    await writeFile(join(root, name), contents)
  }
  return root
}

async function listen(root) {
  const server = await startServer({ root, host: '127.0.0.1', port: 0 })
  servers.push(server)
  return `http://127.0.0.1:${server.address().port}`
}

test('serves index.html for the root path', async () => {
  const root = await makeDocRoot({ 'index.html': '<h1>app root</h1>' })
  const base = await listen(root)

  const response = await fetch(`${base}/`)

  expect(response.status).toBe(200)
  expect(await response.text()).toBe('<h1>app root</h1>')
})

test('serves the app under a sub-path mount', async () => {
  const root = await makeDocRoot({ 'sub/index.html': '<h1>sub path</h1>' })
  const base = await listen(root)

  const response = await fetch(`${base}/sub/`)

  expect(response.status).toBe(200)
  expect(await response.text()).toBe('<h1>sub path</h1>')
})

test('returns 404 for unknown paths', async () => {
  const root = await makeDocRoot({ 'index.html': '<h1>app root</h1>' })
  const base = await listen(root)

  const response = await fetch(`${base}/missing.html`)

  expect(response.status).toBe(404)
})

test('serves assets with their content type', async () => {
  const root = await makeDocRoot({ 'assets/app.js': 'export {}\n' })
  const base = await listen(root)

  const response = await fetch(`${base}/assets/app.js`)

  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toBe('text/javascript; charset=utf-8')
})

test('does not serve files outside the doc root', async () => {
  const container = await mkdtemp(join(tmpdir(), 'ssm-serve-'))
  dirs.push(container)
  const root = join(container, 'root')
  await mkdir(root)
  await writeFile(join(root, 'index.html'), '<h1>app root</h1>')
  await writeFile(join(container, 'outside.txt'), 'outside')
  const base = await listen(root)

  const response = await fetch(`${base}/..%2Foutside.txt`)

  expect(response.status).toBe(404)
})

test('rejects when the doc root does not exist', async () => {
  const missing = join(tmpdir(), `ssm-missing-${Date.now()}`)

  await expect(startServer({ root: missing, host: '127.0.0.1', port: 0 })).rejects.toThrow(
    'Doc root not found',
  )
})

test('returns 400 for a malformed request target', async () => {
  const root = await makeDocRoot({ 'index.html': '<h1>app root</h1>' })
  const base = await listen(root)

  const status = await rawStatus(
    Number(new URL(base).port),
    'GET http://[ HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n',
  )

  expect(status).toBe(400)
})

function rawStatus(port, request) {
  return new Promise((resolvePromise, reject) => {
    const socket = connect(port, '127.0.0.1', () => socket.write(request))
    let response = ''
    socket.on('data', (chunk) => (response += chunk))
    socket.on('close', () => resolvePromise(Number(response.split(' ')[1])))
    socket.on('error', reject)
  })
}
