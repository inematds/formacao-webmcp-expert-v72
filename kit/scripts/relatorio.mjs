// relatorio.mjs — projeto final: roda as sete verificações do curso e escreve o relatório datado do site.
// Uso: node scripts/relatorio.mjs [polyfill|nativo]   (padrão: nativo)
// Grava relatorio/RELATORIO-AAAA-MM-DD.md com a última linha e o código de saída de cada verificação.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const modo = process.argv.includes('polyfill') ? 'polyfill' : 'nativo';
const hoje = new Date().toISOString().slice(0, 10);
const SECOES = [
  ['Camadas (aula 1)', ['scripts/camadas.mjs']],
  ['Uma ação, três superfícies (aula 2)', ['scripts/superficies.mjs', modo]],
  ['Registro de chamadas (aula 3)', ['scripts/observar.mjs', modo]],
  ['Bateria congelada (aula 4)', ['scripts/bateria.mjs']],
  ['Protocolos vizinhos (aula 5)', ['scripts/vizinhos.mjs', ...(process.env.DECISOES ? [process.env.DECISOES] : [])]],
  ['Vigia da spec (aula 6)', ['scripts/vigiar.mjs']],
  ['Governança (aula 7)', ['scripts/governanca.mjs']]
];

const linhas = [`# Relatório — site pronto para agentes · ${hoje.split('-').reverse().join('/')}`, '',
  `Kit do curso WebMCP em produção (Formação WebMCP, curso 5). Modo do navegador: ${modo}. WebMCP = rascunho do CG de 16/10/2026; MCP = revisão 2026-07-28.`, '',
  '| verificação | resultado | saída |', '|---|---|---|'];
let ok = 0;
for (const [titulo, args] of SECOES) {
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 300_000 });
  const saida = (r.stdout || '').trim().split('\n');
  const ultima = saida.filter(l => /^[A-ZÇÃÍÉ]+:/.test(l)).pop() || saida.pop() || '(sem saída)';
  const estado = r.status === 0 ? 'ok' : r.status === 3 ? 'sem conclusão' : 'FALHA';
  if (r.status === 0) ok++;
  console.log(`${estado.padEnd(5)} ${titulo} · ${ultima}`);
  linhas.push(`| ${titulo} | ${ultima.replace(/\|/g, '/')} | ${r.status ?? 'tempo esgotado'} |`);
}
linhas.push('', '## O que fazer quando algo falhar', '',
  '- Bateria ou superfícies: não publique; o detalhe sai em `node scripts/bateria.mjs`.',
  '- Vigia com MUDOU: releia o que mudou na spec ou no MCP, rode a bateria e só então recongele.',
  '- Governança com problema: nenhuma ferramenta nova vai ao ar sem dono, data e nível.', '');
mkdirSync('relatorio', { recursive: true });
const arq = `relatorio/RELATORIO-${hoje}.md`;
writeFileSync(arq, linhas.join('\n'));
console.log(`RELATÓRIO: ${ok}/${SECOES.length} verificações ok → ${arq}`);
process.exit(ok === SECOES.length ? 0 : 1);
