// bateria.mjs — bateria CONGELADA: contrato (nomes + anotações) e casos com resultado esperado, nas três superfícies.
// Uso: node scripts/bateria.mjs [sem|polyfill|nativo|mcp ...]   (sem argumento: os quatro)
//      node scripts/bateria.mjs --recongelar                     (só depois de decidir, por escrito, que o esperado mudou)
// Os casos ficam em bateria/casos.json e bateria/contrato.json; o hash dos dois fica em bateria/CONGELADA.
// Se alguém editar o esperado para o teste passar, a bateria se recusa a rodar (saída 2).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { abrir } from '../lib/navegador.mjs';
import { ligarMcp } from '../lib/mcp.mjs';
import { agenda as agendaMcp } from '../servidor/mcp.mjs';

const ARQS = ['bateria/casos.json', 'bateria/contrato.json'];
const hash = () => ARQS.map(a => `${createHash('sha256').update(readFileSync(a)).digest('hex')}  ${a}`).join('\n') + '\n';
if (process.argv.includes('--recongelar')) { writeFileSync('bateria/CONGELADA', hash()); console.log('recongelada:\n' + hash()); process.exit(0); }
if (readFileSync('bateria/CONGELADA', 'utf8') !== hash()) {
  console.log('BATERIA RECUSADA: casos.json ou contrato.json mudou depois de congelado.');
  console.log('Se o esperado mudou de verdade (spec nova, regra nova), rode --recongelar e explique no commit.');
  process.exit(2);
}
const CASOS = JSON.parse(readFileSync(ARQS[0], 'utf8'));
const CONTRATO = JSON.parse(readFileSync(ARQS[1], 'utf8'));
const HINTS = ['readOnlyHint', 'untrustedContentHint', 'consequentialHint'];

const pedidos = process.argv.slice(2).filter(a => ['sem', 'polyfill', 'nativo', 'mcp'].includes(a));
const modos = pedidos.length ? pedidos : ['sem', 'polyfill', 'nativo', 'mcp'];
let ok = 0, total = 0, versao = false;
const confere = (onde, nome, cond, detalhe = '') => {
  total++; if (cond) ok++;
  console.log(`${cond ? 'ok   ' : 'FALHA'} [${onde}] ${nome}${detalhe ? ' · ' + detalhe : ''}`);
};
const confereEsperado = (onde, c, r) => {
  const e = c.espera, achou = [];
  let bate = true;
  if (e.ids) { const ids = (r.ids || []).join(); achou.push(ids); bate &&= ids === e.ids.join(); }
  if (e.erro !== undefined) { achou.push(r.erro ? 'erro' : 'sem erro'); bate &&= !!r.erro === e.erro; }
  if (e.reservas !== undefined) { achou.push(`${r.reservas} reserva(s)`); bate &&= r.reservas === e.reservas; }
  if (e.comentarios !== undefined) { achou.push(`${r.comentarios} comentário(s)`); bate &&= r.comentarios === e.comentarios; }
  confere(onde, `${c.id} ${c.ferramenta}${c.pessoa ? ' (pessoa ' + c.pessoa + ')' : ''}`, bate, achou.join(', '));
};

for (const modo of modos) {
  if (modo === 'mcp') {
    // Servidor MCP: contrato pelo tools/list, casos pelo tools/call. A "pessoa" responde no cliente (MRTR).
    let mcp = await ligarMcp();
    const lista = await mcp.ferramentas();
    await mcp.fechar();
    const nomes = lista.map(t => t.name).sort().join();
    confere('mcp', `contrato: ${Object.keys(CONTRATO.mcp).length} ferramentas com as anotações congeladas`,
      nomes === Object.keys(CONTRATO.mcp).sort().join() && lista.every(t => HINTS.every(h => !!t.annotations?.[h] === CONTRATO.mcp[t.name].includes(h))), nomes);
    for (const c of CASOS.filter(c => c.superficies.includes('mcp'))) {
      mcp = await ligarMcp({ resposta: c.pessoa === 'recusa' ? 'nao' : 'sim' });
      const r = await mcp.chamar(c.ferramenta, c.entrada);
      await mcp.fechar();
      const recusada = r.isError && /recusada/.test(r.content?.[0]?.text || '');
      confereEsperado('mcp', c, { ids: r.structuredContent?.oficinas?.map(o => o.id), erro: r.isError && !recusada, reservas: agendaMcp.reservas().length });
    }
    continue;
  }
  const n = await abrir(modo, { largura: 390 });
  if (!versao) { console.log(`== ${n.versao.replace(/ · modo: .*/, '')} · bateria congelada (spec ${CONTRATO.spec_webmcp}, MCP ${CONTRATO.protocolo_mcp})`); versao = true; }
  const estado = await n.page.evaluate(() => document.documentElement.dataset.webmcp);
  if (modo === 'sem') {
    // Sem a API: nenhuma ferramenta e o caminho da pessoa funcionando igual.
    confere(modo, 'fallback: página sem WebMCP e sem erro de JavaScript', estado === 'sem' && n.erros.length === 0, estado);
    await n.page.fill('#nome', 'Rita');
    await n.page.click('[data-reservar="of-301"]');
    await n.page.click('#conf-sim');
    confere(modo, 'fallback: a pessoa reserva pelo formulário', (await n.page.textContent('#reservas')).includes('Rita'));
    await n.fechar();
    continue;
  }
  const lista = await n.page.evaluate(async () => document.modelContext
    ? (await document.modelContext.getTools()).map(t => ({ name: t.name, annotations: t.annotations || {} })) : []);
  const nomes = lista.map(t => t.name).sort().join();
  confere(modo, `contrato: ${Object.keys(CONTRATO.webmcp).length} ferramentas com as anotações congeladas`,
    nomes === Object.keys(CONTRATO.webmcp).sort().join() && lista.every(t => HINTS.every(h => !!t.annotations[h] === CONTRATO.webmcp[t.name].includes(h))),
    `${lista.length} registradas`);
  for (const c of CASOS.filter(c => c.superficies.includes('webmcp'))) {
    if (!lista.some(t => t.name === c.ferramenta)) { confere(modo, `${c.id} ${c.ferramenta}`, false, 'ferramenta ausente'); continue; }
    const p = n.page.evaluate(async ([nome, input]) => {
      const mc = document.modelContext;
      const t = (await mc.getTools()).find(x => x.name === nome);
      try { return JSON.parse(await mc.executeTool(t, input)); } catch (e) { return { excecao: e.name }; }   // objeto entra, texto JSON sai
    }, [c.ferramenta, c.entrada]);
    if (c.pessoa) {
      await n.page.locator('#confirmar:not([hidden])').waitFor({ timeout: 5000 }).catch(() => {});
      if (await n.page.isVisible('#confirmar')) await n.page.click(c.pessoa === 'confirma' ? '#conf-sim' : '#conf-nao');
    }
    const r = await p;
    const reservas = await n.page.$$eval('#reservas li', lis => lis.filter(li => !li.textContent.startsWith('Nenhuma')).length);
    confereEsperado(modo, c, { ids: r.oficinas?.map(o => o.id), erro: !!(r.erro || r.excecao), reservas, comentarios: r.comentarios?.length });
  }
  confere(modo, 'nenhum erro de JavaScript', n.erros.length === 0, n.erros.join(' | '));
  await n.fechar();
}
console.log(`BATERIA: ${ok}/${total} ok`);
process.exit(ok === total ? 0 : 1);
