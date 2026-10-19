// camadas.mjs — procura evidência das 8 camadas de um site pronto para agentes numa pasta de projeto.
// Uso: node scripts/camadas.mjs [pasta]   (padrão: a pasta do kit)
// Mede PRESENÇA de evidência no código, não qualidade. Cada camada diz o status em 19/10/2026 e onde se aprende.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const raiz = resolve(process.argv[2] || '.');
const PULAR = new Set(['node_modules', 'vendor', '.git', 'saidas', 'blocos', 'logs', 'relatorio']);
const arquivos = [];
(function andar(d) {
  for (const n of readdirSync(d)) {
    if (PULAR.has(n) || n.startsWith('.')) continue;
    const p = join(d, n);
    if (statSync(p).isDirectory()) andar(p);
    else if (/\.(m?js|ts|html|json|txt|xml)$/.test(n) && statSync(p).size < 500_000) arquivos.push(p);
  }
})(raiz);
const ler = p => readFileSync(p, 'utf8');
const acha = (re, filtro = () => true) => arquivos.filter(p => !/ruim/.test(p)).filter(filtro).find(p => re.test(ler(p)));   // exemplos "ruins" não contam
const nome = p => p ? relative(raiz, p) : '';

const CAMADAS = [
  ['Descoberta', 'estável (robots, sitemap); llms.txt sem efeito medido', 'Formação inemaSEO', () => arquivos.find(p => /(^|\/)(robots\.txt|sitemap\.xml)$/.test(p))],
  ['Ferramentas', 'rascunho CG de 16/10/2026 (document.modelContext)', 'curso 2', () => acha(/document\.modelContext/, p => /registerTool/.test(ler(p)))],
  ['Contrato', 'estável como prática (nome, descrição, JSON Schema)', 'cursos 1 e 2', () => acha(/inputSchema[\s\S]{0,400}description|description[\s\S]{0,400}inputSchema/)],
  ['Estado e erros', 'estável como prática (erro de regra volta como dado)', 'curso 2', () => acha(/\{\s*erro\s*:|isError\s*:\s*true/)],
  ['Controle', 'anotação consequentialHint: rascunho; confirmação: prática estável', 'cursos 2 e 4', () => acha(/consequentialHint\s*:\s*true/, p => /\.m?js$/.test(p))],
  ['Permissões', 'exposedTo e iframes: rascunho; catálogo aprovado: prática', 'curso 4 + este curso', () => acha(/"nivel"\s*:|exposedTo/)],
  ['Backend e MCP', 'MCP 2026-07-28 estável; mesma regra das duas pontas', 'curso 1 + este curso', () => acha(/registerTool\(/, p => /McpServer/.test(ler(p)))],
  ['Evals e observabilidade', 'prática estável: bateria congelada e registro', 'este curso + LOOP-R Eng.', () => acha(/"espera"\s*:|observado\(/)]
];

console.log(`camadas · ${raiz.replace(process.env.HOME || '~', '~')} · ${arquivos.length} arquivos lidos`);
let n = 0;
CAMADAS.forEach(([titulo, status, dono, prova], i) => {
  const p = prova();
  if (p) n++;
  console.log(`${p ? 'ok   ' : 'falta'} ${i + 1} ${titulo.padEnd(24)} ${p ? nome(p) : '(nenhuma evidência)'}`);
  console.log(`        ${status} · onde: ${dono}`);
});
console.log(`CAMADAS: ${n}/8 com evidência`);
process.exit(n === 8 ? 0 : 1);
