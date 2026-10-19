// navegador.mjs (copiado do curso 2, formacao-webmcp-site-v72) — servidor local + Chromium do Playwright em três modos:
//   sem      → Chromium sem WebMCP (o caso da maioria dos visitantes): o site tem de funcionar igual
//   polyfill → ensaio sem Chrome experimental: a página carrega @mcp-b/webmcp-polyfill 6.0.3 (?ensaio=polyfill)
//   nativo   → Chromium com a flag de teste do WebMCP (--enable-features=WebMCPTesting, = chrome://flags/#enable-webmcp-testing)
// PAGINA=<pasta> troca a pasta servida (padrão: kit/pagina). Use para testar a sua cópia.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
export const MODOS = ['sem', 'polyfill', 'nativo'];

export async function servir(pasta = resolve(process.env.PAGINA || resolve(KIT, 'pagina'))) {
  const srv = createServer(async (req, res) => {
    let caminho = resolve(pasta, '.' + decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (caminho.endsWith('/') || caminho === pasta) caminho = resolve(caminho, 'index.html');
    if (!caminho.startsWith(pasta)) return res.writeHead(403).end();
    try { const dado = await readFile(caminho); res.setHeader('Content-Type', TIPOS[extname(caminho)] || 'text/plain'); res.end(dado); }
    catch { res.writeHead(404).end(); }
  });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));   // 127.0.0.1 = contexto seguro, como https
  return { url: `http://127.0.0.1:${srv.address().port}/`, fechar: () => new Promise(ok => srv.close(ok)) };
}

export async function abrir(modo, { pagina = '', largura = 1280 } = {}) {
  if (!MODOS.includes(modo)) throw new Error(`modo inválido: ${modo} (use ${MODOS.join(', ')})`);
  const srv = await servir();
  const browser = await chromium.launch({ args: modo === 'nativo' ? ['--enable-features=WebMCPTesting'] : [] });
  const page = await browser.newPage({ viewport: { width: largura, height: 900 } });
  const erros = [];
  page.on('pageerror', e => erros.push(e.message));
  const sufixo = modo === 'polyfill' ? (pagina.includes('?') ? '&' : '?') + 'ensaio=polyfill' : '';
  await page.goto(srv.url + pagina + sufixo);
  await page.waitForFunction(() => document.documentElement.dataset.webmcp, null, { timeout: 10000 }).catch(() => {});
  return {
    browser, page, erros, url: srv.url,
    versao: `Chromium ${browser.version()} (Playwright) · modo: ${modo}`,
    async fechar() { await browser.close(); await srv.fechar(); }
  };
}

// Lê o modo do argumento (padrão polyfill) e recusa valor errado com saída 2.
export function modoDoArgumento(argv = process.argv.slice(2), padrao = 'polyfill') {
  const m = argv.find(a => MODOS.includes(a)) || padrao;
  return m;
}
