// app.mjs — liga a regra (oficinas.mjs) à tela e, se houver WebMCP, às ferramentas liberadas pela governança.
import { criarAgenda } from './oficinas.mjs';
import { catalogo, liberadas, comRegistro, iniciarWebMCP } from './ferramentas.mjs';
import { observado } from './registro.mjs';

const $ = s => document.querySelector(s);
const agenda = criarAgenda();

const ui = {
  aviso(texto) { $('#aviso').textContent = texto; },
  mostrarResultados(lista, filtro = {}) {
    $('#tema').value = filtro.tema || '';
    $('#comvaga').checked = !!filtro.apenasComVaga;
    $('#resultados').replaceChildren(...lista.map(o => {
      const li = document.createElement('li');
      li.dataset.id = o.id;
      li.textContent = `${o.id} · ${o.titulo} · ${o.data} · vagas: ${o.vagas} `;
      if (o.vagas > 0) {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = 'Reservar'; b.dataset.reservar = o.id;
        li.append(b);
      }
      return li;
    }));
  },
  mostrarReservas() {
    const r = agenda.reservas();
    $('#reservas').replaceChildren(...(r.length ? r : [null]).map(x => {
      const li = document.createElement('li');
      li.textContent = x ? `${x.id} · ${x.titulo} · ${x.nome}` : 'Nenhuma reserva.';
      return li;
    }));
  },
  // Painel de confirmação: a reserva só acontece se a PESSOA clicar em Confirmar.
  pedirConfirmacao({ oficina, nome }, signal) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return reject(new DOMException('cancelado', 'AbortError'));
      const painel = $('#confirmar');
      $('#conf-texto').textContent = `Reservar "${oficina.titulo}" (${oficina.data}) para ${nome}?`;
      painel.hidden = false; $('#conf-sim').focus();
      const fim = valor => { painel.hidden = true; $('#conf-sim').onclick = $('#conf-nao').onclick = null; resolve(valor); };
      $('#conf-sim').onclick = () => fim(true);
      $('#conf-nao').onclick = () => fim(false);
      signal?.addEventListener('abort', () => { painel.hidden = true; reject(new DOMException('cancelado', 'AbortError')); }, { once: true });
    });
  }
};

// Caminho da pessoa (superfície html): a MESMA regra, também registrada.
const buscarPelaTela = observado('html', 'buscar_oficinas', async filtro => agenda.buscar(filtro));
const reservarPelaTela = observado('html', 'reservar_vaga', async ({ id, nome }) => {
  if (!(await ui.pedirConfirmacao({ oficina: agenda.oficina(id), nome }))) return { reservado: false };
  try { const reserva = agenda.reservar({ id, nome }); ui.mostrarReservas(); return { reservado: true, reserva }; }
  catch (erro) { ui.aviso(erro.message); return { erro: erro.message }; }
});

$('#busca').addEventListener('submit', async e => {
  e.preventDefault();
  const filtro = { apenasComVaga: $('#comvaga').checked };
  if ($('#tema').value) filtro.tema = $('#tema').value;
  ui.mostrarResultados(await buscarPelaTela(filtro), filtro);
});
$('#resultados').addEventListener('click', async e => {
  const id = e.target.dataset?.reservar;
  if (!id) return;
  const nome = $('#nome').value.trim();
  if (nome.length < 2) { ui.aviso('Escreva seu nome em "Minhas reservas" antes de reservar.'); $('#nome').focus(); return; }
  await reservarPelaTela({ id, nome });
});

ui.mostrarResultados(agenda.buscar({}));

// Ensaio sem Chrome experimental: ?ensaio=polyfill carrega o polyfill (só no ensaio, nunca em produção).
async function talvezPolyfill() {
  if (new URLSearchParams(location.search).get('ensaio') !== 'polyfill' || document.modelContext) return;
  await new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = './vendor/webmcp-polyfill.js'; s.onload = ok; s.onerror = falha;
    document.head.append(s);
  });
}

// Governança: o catálogo aprovado vem de governanca.json, sem cache. Falhou a leitura → nenhuma ferramenta.
async function lerGovernanca() {
  try { return await (await fetch('./governanca.json', { cache: 'no-store' })).json(); }
  catch { return null; }
}

await talvezPolyfill().catch(() => {});
const gov = await lerGovernanca();
const defs = comRegistro(liberadas(catalogo(agenda, ui), gov, 'webmcp'));
const estado = await iniciarWebMCP(defs, ui);
if (estado.modo === 'com') ui.aviso(`WebMCP ativo: ${estado.registradas} ferramentas registradas (catálogo ${gov?.versao_catalogo}).`);
document.documentElement.dataset.webmcp = estado.modo;   // os testes leem daqui
document.documentElement.dataset.catalogo = gov?.versao_catalogo || 'sem-governanca';
