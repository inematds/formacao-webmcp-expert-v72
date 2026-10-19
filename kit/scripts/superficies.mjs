// superficies.mjs — a mesma ação nas três superfícies: a tela (HTML), WebMCP na página e MCP no servidor.
// Uso: node scripts/superficies.mjs [polyfill|nativo]   (padrão: polyfill)
// Confere: a busca devolve o mesmo nas três; a reserva, nas três, só acontece depois de a pessoa dizer sim.
import { abrir, modoDoArgumento } from '../lib/navegador.mjs';
import { ligarMcp } from '../lib/mcp.mjs';

const modo = modoDoArgumento(process.argv.slice(2).filter(a => a !== 'sem'));
const FILTRO = { tema: 'html', apenasComVaga: true };
const n = await abrir(modo);
const mcp = await ligarMcp({ resposta: 'sim' });
console.log(`== ${n.versao} · MCP ${mcp.era === 'modern' ? '2026-07-28' : mcp.era} (SDK 2.3.1)`);

// 1. Busca
const pelaTela = async () => {
  await n.page.selectOption('#tema', FILTRO.tema);
  await n.page.check('#comvaga');
  await n.page.click('#busca button[type=submit]');
  return n.page.$$eval('#resultados li', lis => lis.map(li => li.dataset.id).join());
};
const pelaPagina = () => n.page.evaluate(async filtro => {
  const mc = document.modelContext;
  if (!mc) return '(sem document.modelContext)';
  const t = (await mc.getTools()).find(x => x.name === 'buscar_oficinas');
  if (!t) return '(ferramenta ausente)';
  return JSON.parse(await mc.executeTool(t, filtro)).oficinas.map(o => o.id).join();   // objeto entra, texto JSON sai
}, FILTRO);
const peloServidor = async () => {
  const r = await mcp.chamar('buscar_oficinas', FILTRO);
  return r.isError ? `(erro: ${r.content[0].text})` : r.structuredContent.oficinas.map(o => o.id).join();
};
const busca = { html: await pelaTela(), webmcp: await pelaPagina(), mcp: await peloServidor() };
console.log(`buscar_oficinas ${JSON.stringify(FILTRO)}`);
for (const [s, v] of Object.entries(busca)) console.log(`  ${s.padEnd(7)}→ ${v}`);
const iguais = Object.values(busca).filter(v => v === busca.html).length;

// 2. Reserva: três jeitos de pedir a pessoa, a mesma regra no fim.
console.log('reservar_vaga of-101');
let pediu = 0;
await n.page.fill('#nome', 'Rita');
await n.page.click('[data-reservar="of-101"]');
const viuTela = await n.page.isVisible('#confirmar');
await n.page.click('#conf-sim');
const okTela = (await n.page.textContent('#reservas')).includes('Rita');
if (viuTela && okTela) pediu++;
console.log(`  html   → painel Confirmar na página → ${okTela ? 'reservado' : 'NÃO reservado'}`);

const p = n.page.evaluate(async () => {
  const mc = document.modelContext;
  const t = (await mc.getTools()).find(x => x.name === 'reservar_vaga');
  return JSON.parse(await mc.executeTool(t, { id: 'of-101', nome: 'Caio' }));
});
const viuAgente = await n.page.locator('#confirmar:not([hidden])').waitFor({ timeout: 5000 }).then(() => true, () => false);
if (viuAgente) await n.page.click('#conf-sim');
const rAgente = await p;
if (viuAgente && rAgente.reservado) pediu++;
console.log(`  webmcp → consequentialHint + Confirmar na página → ${rAgente.reservado ? 'reservado' : JSON.stringify(rAgente)}`);

const rMcp = await mcp.chamar('reservar_vaga', { id: 'of-101', nome: 'Duda' });
if (mcp.perguntas.length === 1 && !rMcp.isError) pediu++;
console.log(`  mcp    → MRTR: o cliente perguntou "${mcp.perguntas[0] ?? '(nada)'}" → ${rMcp.isError ? 'NÃO reservado' : 'reservado'}`);

console.log(`SUPERFÍCIES: ${iguais}/3 iguais na busca · ${pediu}/3 reservas esperaram a pessoa`);
await mcp.fechar();
await n.fechar();
process.exit(iguais === 3 && pediu === 3 && n.erros.length === 0 ? 0 : 1);
