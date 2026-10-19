// observar.mjs — provoca os cinco desfechos de uma chamada e mostra o registro que cada superfície deixa.
// Uso: node scripts/observar.mjs [polyfill|nativo]   (padrão: polyfill)
// Grava logs/chamadas.jsonl (uma linha JSON por chamada) e confere que nenhum dado pessoal foi parar no registro.
import { mkdirSync, writeFileSync } from 'node:fs';
import { abrir, modoDoArgumento } from '../lib/navegador.mjs';
import { ligarMcp } from '../lib/mcp.mjs';
import { linhasRegistradas } from '../pagina/registro.mjs';

const modo = modoDoArgumento(process.argv.slice(2).filter(a => a !== 'sem'));
const n = await abrir(modo);
console.log(`== ${n.versao}`);

// Pela tela: a pessoa busca (superfície html).
await n.page.selectOption('#tema', 'html');
await n.page.click('#busca button[type=submit]');

// Pelo agente na página (superfície webmcp): ok, erro de regra, recusa na tela e cancelamento.
const chamar = (nome, input, { abortarEm } = {}) => n.page.evaluate(async ([nome, input, abortarEm]) => {
  const mc = document.modelContext;
  const t = (await mc.getTools()).find(x => x.name === nome);
  const ctl = new AbortController();
  if (abortarEm) setTimeout(() => ctl.abort(), abortarEm);
  try { return JSON.parse(await mc.executeTool(t, input, { signal: ctl.signal })); }
  catch (e) { return { excecao: e.name }; }
}, [nome, input, abortarEm]);
await chamar('buscar_oficinas', { tema: 'webmcp' });
await chamar('buscar_oficinas', { tema: 'cobol' });
const recusa = chamar('reservar_vaga', { id: 'of-301', nome: 'Rita Souza' });
await n.page.locator('#confirmar:not([hidden])').waitFor({ timeout: 5000 });
await n.page.click('#conf-nao');
await recusa;
await chamar('reservar_vaga', { id: 'of-201', nome: 'Rita Souza' }, { abortarEm: 300 });   // ninguém responde: o agente desiste

// Pelo servidor MCP (superfície mcp): ok e recusa no cliente.
const mcp = await ligarMcp({ resposta: 'nao' });
await mcp.chamar('buscar_oficinas', { tema: 'mcp' });
await mcp.chamar('reservar_vaga', { id: 'of-302', nome: 'Rita Souza' });
await mcp.fechar();

const linhas = [...(await n.page.evaluate(() => globalThis.__registro || [])), ...linhasRegistradas()];
await n.fechar();
mkdirSync('logs', { recursive: true });
const jsonl = linhas.map(l => JSON.stringify(l)).join('\n') + '\n';
writeFileSync('logs/chamadas.jsonl', jsonl);

for (const l of linhas) console.log(`${l.superficie.padEnd(6)} ${l.ferramenta.padEnd(16)} ${l.resultado.padEnd(12)} ${String(l.ms).padStart(4)} ms${l.motivo ? ' · ' + l.motivo : ''}`);
const conta = r => linhas.filter(l => l.resultado === r).length;
const limpo = !jsonl.includes('Rita');
console.log(`REGISTRO: ${linhas.length} chamadas · ok ${conta('ok')} · erro ${conta('erro')} · recusado ${conta('recusado')} · cancelado ${conta('cancelado')} · pediu-pessoa ${conta('pediu-pessoa')} · dado pessoal no registro: ${limpo ? 'não' : 'SIM'}`);
console.log('gravado em logs/chamadas.jsonl');
process.exit(limpo && conta('cancelado') === 1 && conta('erro') === 1 && conta('recusado') === 2 ? 0 : 1);
