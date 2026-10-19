// governanca.mjs — confere o catálogo aprovado (governanca.json) contra o código das duas superfícies.
// Uso: node scripts/governanca.mjs [caminho/governanca.json]   (padrão: pagina/governanca.json)
// Regras: toda ferramenta do código está no catálogo com dono, data de aprovação e nível 0–3;
// ação com consequência fica no nível 1 (propõe e espera a pessoa) ou 0; nível 0 não pode estar ativa.
import { readFileSync } from 'node:fs';
import { catalogo } from '../pagina/ferramentas.mjs';
import { FERRAMENTAS_MCP } from '../servidor/mcp.mjs';

const arq = process.argv[2] || 'pagina/governanca.json';
const gov = JSON.parse(readFileSync(arq, 'utf8'));
const problemas = [];
const falta = (nome, txt) => { if (!problemas.includes(`${nome}: ${txt}`)) problemas.push(`${nome}: ${txt}`); };

// O que o código define (página: lido sem navegador; servidor: ferramentas que a fábrica conhece).
const webmcp = catalogo({}, {}).map(d => ({ nome: d.name, comEfeito: !!d.annotations?.consequentialHint || !d.annotations?.readOnlyHint }));
const mcp = FERRAMENTAS_MCP.map(f => ({ nome: f.nome, comEfeito: !f.config.annotations?.readOnlyHint }));

const porNome = new Map((gov.ferramentas || []).map(f => [f.nome, f]));
for (const [sup, lista] of [['webmcp', webmcp], ['mcp', mcp]]) {
  for (const t of lista) {
    const f = porNome.get(t.nome);
    if (!f) { falta(t.nome, `está no código (${sup}) mas não no catálogo aprovado`); continue; }
    if (t.comEfeito && f.nivel > 1) falta(t.nome, `tem consequência e está no nível ${f.nivel} (máximo 1: propõe e espera a pessoa)`);
  }
}
for (const f of gov.ferramentas || []) {
  if (!f.dono) falta(f.nome, 'sem dono');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.aprovada_em || '')) falta(f.nome, 'sem data de aprovação (AAAA-MM-DD)');
  if (![0, 1, 2, 3].includes(f.nivel)) falta(f.nome, 'nível fora de 0–3');
  if (!['ativa', 'desligada'].includes(f.estado)) falta(f.nome, `estado "${f.estado}" (use ativa ou desligada)`);
  if (f.nivel === 0 && f.estado === 'ativa') falta(f.nome, 'nível 0 (não toca) não pode estar ativa');
}
if (!gov.versao_catalogo) falta('catálogo', 'sem versao_catalogo');

const ativas = (gov.ferramentas || []).filter(f => f.estado === 'ativa').length;
console.log(`catálogo ${gov.versao_catalogo ?? '?'} · ${(gov.ferramentas || []).length} ferramentas (${ativas} ativas) · código: ${webmcp.length} na página, ${mcp.length} no servidor`);
for (const p of problemas) console.log(`PROBLEMA ${p}`);
console.log(`GOVERNANÇA: ${problemas.length} problema(s)`);
process.exit(problemas.length ? 1 : 0);
