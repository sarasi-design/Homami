// Serves the built app (dist/) with the same safety settings as the live site (vercel.json),
// so the browser tests see what visitors see. Used by e2e/setup.ts.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json' }

export function serve(root: string, port: number): Promise<http.Server> {
  const { headers: rules } = JSON.parse(fs.readFileSync('vercel.json', 'utf8')) as { headers: { source: string; headers: { key: string; value: string }[] }[] }
  const server = http.createServer((req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://localhost')
    let file = path.join(root, path.normalize(pathname).replace(/^(\.\.[/\\])+/, ''))
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html')
    for (const rule of rules) {
      if (new RegExp(`^${rule.source}$`).test(pathname)) for (const h of rule.headers) res.setHeader(h.key, h.value)
    }
    res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream')
    res.end(fs.readFileSync(file))
  })
  return new Promise((resolve) => server.listen(port, () => resolve(server)))
}
