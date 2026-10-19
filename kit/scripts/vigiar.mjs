// vigiar.mjs — vigia de API que muda: compara o que a spec do WebMCP, o Chrome Status e o MCP dizem HOJE
// com a base gravada no dia em que a sua bateria passou. Mudou → saída 1: rode a bateria e releia o que mudou.
// Uso: node scripts/vigiar.mjs [--base vigia/base.json] [--gravar]
// Lê páginas públicas (sem chave, sem custo): a spec do W3C CG, o JSON público do Chrome Status e modelcontextprotocol.io.
import { readFileSync, writeFileSync } from 'node:fs';
import { versaoAnunciada } from '../lib/mcp.mjs';

const arg = (n, padrao) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : padrao; };
const arqBase = arg('--base', 'vigia/base.json');
const MESES = { January: '01', February: '02', March: '03', April: '04', May: '05', June: '06', July: '07', August: '08', September: '09', October: '10', November: '11', December: '12' };
const texto = async url => { const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (vigia do kit INEMA)' } }); if (!r.ok) throw new Error(`${r.status} em ${url}`); return r.text(); };

async function observar() {
  const spec = (await texto('https://webmachinelearning.github.io/webmcp/')).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
  const d = spec.match(/Draft Community Group Report, (\d{1,2}) ([A-Z][a-z]+) (\d{4})/);
  const metodos = ['registerTool', 'getTools', 'executeTool', 'toolchange', 'unregisterTool', 'provideContext', 'clearContext'];
  const cs = JSON.parse((await texto('https://chromestatus.com/api/v0/features/5117755740913664')).replace(/^\)\]\}'\n?/, ''));
  const ot = cs.stages?.find(s => s.stage_type === 150);
  const mcp = (await texto('https://modelcontextprotocol.io/specification/versioning')).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
  return {
    spec_data: d ? `${d[3]}-${MESES[d[2]]}-${d[1].padStart(2, '0')}` : '(não achei a data)',
    spec_superficie: spec.includes('document.modelContext') && !spec.includes('navigator.modelContext') ? 'document'
      : spec.includes('navigator.modelContext') ? 'navigator (ou os dois)' : '(nenhuma)',
    spec_metodos: metodos.filter(m => spec.includes(m)).join(' '),
    chrome_status: cs.browsers?.chrome?.status?.text ?? '?',
    chrome_origin_trial: ot ? `${ot.desktop_first}–${ot.desktop_last}` : '(sem origin trial)',
    mcp_versao_atual: mcp.match(/current protocol version is\s+(\d{4}-\d{2}-\d{2})/)?.[1] ?? '(não achei)',
    sdk_mcp_anuncia: (await versaoAnunciada()).join(' ')
  };
}

let agora;
try { agora = await observar(); }
catch (e) { console.log(`SEM CONCLUSÃO: não consegui ler as fontes (${e.message}). Sem rede, a vigia não diz nada.`); process.exit(3); }

if (process.argv.includes('--gravar')) {
  writeFileSync(arqBase, JSON.stringify({ gravada_em: new Date().toISOString().slice(0, 10), ...agora }, null, 2) + '\n');
  console.log(`base gravada em ${arqBase}`); process.exit(0);
}
const base = JSON.parse(readFileSync(arqBase, 'utf8'));
console.log(`vigia · base de ${base.gravada_em.split('-').reverse().join('/')} (${arqBase})`);
let mud = 0, comp = 0;
for (const [k, v] of Object.entries(agora)) {
  if (!(k in base)) { console.log(`sem base  ${k.padEnd(20)} ${v}`); continue; }
  comp++;
  if (base[k] === v) console.log(`igual     ${k.padEnd(20)} ${v}`);
  else { mud++; console.log(`MUDOU     ${k.padEnd(20)} ${base[k]} → ${v}`); }
}
console.log(mud ? `VIGIA: ${mud} mudança(s) em ${comp} · rode a bateria e releia o que mudou` : `VIGIA: ${comp}/${comp} iguais à base · nada a fazer`);
process.exit(mud ? 1 : 0);
