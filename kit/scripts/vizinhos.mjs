// vizinhos.mjs — confere as SUAS decisões sobre os protocolos vizinhos contra o mapa datado (vizinhos/mapa.json).
// Uso: node scripts/vizinhos.mjs [vizinhos/minhas-decisoes.json]   (padrão: o exemplo da agenda de oficinas)
// Regras: uma decisão por protocolo do mapa (adotar | esperar | nao-se-aplica), com motivo;
// adotar algo que não é estável exige data de revisão e o que acontece sem ele (fallback);
// nenhum motivo pode prometer ranking, posição ou "virar padrão" (nada no mapa é isso).
import { readFileSync } from 'node:fs';

const mapa = JSON.parse(readFileSync('vizinhos/mapa.json', 'utf8'));
const arq = process.argv[2] || 'vizinhos/agenda-oficinas.json';
const dec = JSON.parse(readFileSync(arq, 'utf8'));
const problemas = [];
const porNome = new Map(dec.decisoes.map(d => [d.nome, d]));

console.log(`mapa lido em ${mapa.lido_em.split('-').reverse().join('/')} · decisões de: ${dec.site}`);
for (const p of mapa.protocolos) {
  const d = porNome.get(p.nome);
  if (!d) { problemas.push(`${p.nome}: sem decisão`); console.log(`  ${p.nome.padEnd(13)} ${p.status.padEnd(9)} —`); continue; }
  console.log(`  ${p.nome.padEnd(13)} ${p.status.padEnd(9)} ${d.decisao}`);
  if (!['adotar', 'esperar', 'nao-se-aplica'].includes(d.decisao)) problemas.push(`${p.nome}: decisão "${d.decisao}" (use adotar, esperar ou nao-se-aplica)`);
  if ((d.motivo || '').length < 15) problemas.push(`${p.nome}: motivo curto demais`);
  if (/ranking|posi[cç][aã]o no google|vai ser o padr[aã]o|virar padr[aã]o/i.test(d.motivo || '')) problemas.push(`${p.nome}: motivo promete ranking ou padrão ("${d.motivo}")`);
  if (d.decisao === 'adotar' && p.status !== 'estavel' && !(/^\d{4}-\d{2}-\d{2}$/.test(d.revisar_em || '') && d.fallback))
    problemas.push(`${p.nome}: adotar algo em ${p.status} pede revisar_em (AAAA-MM-DD) e fallback`);
}
for (const p of problemas) console.log(`PROBLEMA ${p}`);
console.log(`VIZINHOS: ${mapa.protocolos.length} protocolos · ${dec.decisoes.length} decisões · ${problemas.length} problema(s)`);
process.exit(problemas.length ? 1 : 0);
