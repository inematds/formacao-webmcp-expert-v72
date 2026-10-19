// desligar.mjs — ensaio do botão de desligar: tira UMA ferramenta do ar pelo catálogo aprovado, sem deploy de código.
// Uso: node scripts/desligar.mjs <ferramenta> [polyfill|nativo]   (padrão: polyfill)
// Trabalha numa CÓPIA da página (pasta temporária): o kit não muda. Confere WebMCP, MCP e o formulário.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const alvo = args.find(a => !['polyfill', 'nativo'].includes(a));
const modo = args.includes('nativo') ? 'nativo' : 'polyfill';
if (!alvo) { console.log('uso: node scripts/desligar.mjs <ferramenta> [polyfill|nativo]'); process.exit(2); }

// A página e o servidor leem o catálogo da pasta em PAGINA: aponte para a cópia ANTES de importar.
const copia = mkdtempSync(join(tmpdir(), 'desligar-'));
cpSync('pagina', copia, { recursive: true });
process.env.PAGINA = copia;
const { abrir } = await import('../lib/navegador.mjs');
const { ligarMcp } = await import('../lib/mcp.mjs');

async function contar() {
  const n = await abrir(modo);
  const webmcp = await n.page.evaluate(async () => document.modelContext ? (await document.modelContext.getTools()).map(t => t.name) : []);
  const mcp = await ligarMcp();
  const servidor = (await mcp.ferramentas()).map(t => t.name);
  await mcp.fechar();
  return { n, webmcp, servidor };
}

const antes = await contar();
console.log(`== ${antes.n.versao}`);
await antes.n.fechar();
console.log(`antes:  WebMCP ${antes.webmcp.length} ferramentas · MCP ${antes.servidor.length} ferramentas`);

const arq = join(copia, 'governanca.json');
const gov = JSON.parse(readFileSync(arq, 'utf8'));
const f = gov.ferramentas.find(x => x.nome === alvo);
if (!f) { console.log(`${alvo} não está no catálogo`); rmSync(copia, { recursive: true }); process.exit(2); }
f.estado = 'desligada';
writeFileSync(arq, JSON.stringify(gov, null, 2));
console.log(`desligada: ${alvo} (estado "desligada" no governanca.json, nenhum código mudou)`);

const depois = await contar();
console.log(`depois: WebMCP ${depois.webmcp.length} ferramentas · MCP ${depois.servidor.length} ferramentas`);
// O caminho da pessoa continua: reservar pelo formulário.
await depois.n.page.fill('#nome', 'Rita');
await depois.n.page.click('[data-reservar="of-301"]');
await depois.n.page.click('#conf-sim');
const tela = (await depois.n.page.textContent('#reservas')).includes('Rita');
console.log(`formulário: ${tela ? 'a pessoa reservou of-301 normalmente' : 'QUEBROU'}`);
await depois.n.fechar();
rmSync(copia, { recursive: true });

const saiu = !depois.webmcp.includes(alvo) && !depois.servidor.includes(alvo);
console.log(`DESLIGAR: ${saiu && tela ? 'ok' : 'FALHOU'} · ${alvo} fora do WebMCP e do MCP, formulário ${tela ? 'funcionando' : 'quebrado'}`);
process.exit(saiu && tela ? 0 : 1);
