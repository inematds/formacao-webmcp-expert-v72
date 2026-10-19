// registro.mjs — observabilidade nas fronteiras: uma linha por chamada de ferramenta, em qualquer superfície.
// Roda no navegador (página) e no Node (servidor MCP). Não guarda dado pessoal: só o NOME dos campos de entrada.
// Resultado: ok | erro (regra recusou) | recusado (a pessoa disse não) | cancelado (AbortSignal) | excecao
//            | pediu-pessoa (MCP: a 1ª volta do MRTR devolve input_required e o cliente pergunta ao usuário).

const linhas = [];
let destino = null;   // função que recebe cada linha (no servidor: grava JSONL; na página: sendBeacon em produção)

export function aoRegistrar(fn) { destino = fn; }
export function linhasRegistradas() { return linhas.map(l => ({ ...l })); }

export function classificar(r) {
  if (r && typeof r === 'object') {
    if (r.resultType === 'input_required') return 'pediu-pessoa';
    if ('erro' in r) return 'erro';
    if (r.reservado === false) return 'recusado';
  }
  return 'ok';
}

export function anotar(linha) {
  const l = { t: new Date().toISOString(), ...linha };
  linhas.push(l);
  globalThis.__registro = linhas;    // os testes leem daqui
  destino?.(l);
  return l;
}

// Embrulha o execute de uma ferramenta: mede o tempo e anota o resultado, sem mudar o que ela devolve.
export function observado(superficie, ferramenta, fn) {
  return async (input = {}, opcoes) => {
    const inicio = performance.now();
    const base = { superficie, ferramenta, campos: Object.keys(input).sort() };
    try {
      const r = await fn(input, opcoes);
      anotar({ ...base, resultado: classificar(r), ms: Math.round(performance.now() - inicio), ...(r?.erro ? { motivo: r.erro } : {}) });
      return r;
    } catch (e) {
      anotar({ ...base, resultado: e.name === 'AbortError' ? 'cancelado' : 'excecao', ms: Math.round(performance.now() - inicio), motivo: e.name });
      throw e;
    }
  };
}
