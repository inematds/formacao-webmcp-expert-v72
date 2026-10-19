// mcp.mjs — o servidor MCP da agenda de oficinas: a MESMA regra da página (pagina/oficinas.mjs).
// SDK oficial v2 (@modelcontextprotocol/server 2.3.1, 05/10/2026), revisão 2026-07-28 do MCP (sem initialize, sem sessão).
// Não chama modelo nem serviço pago. Montagem e transporte: curso 1 (formacao-webmcp-mcp-v72).
import { readFileSync, appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer, acceptedContent, inputRequired, inputResponse } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import { criarAgenda, TEMAS } from '../pagina/oficinas.mjs';
import { observado, aoRegistrar } from '../pagina/registro.mjs';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// PAGINA=<pasta> troca de onde vem o governanca.json (o mesmo arquivo que a página lê).
const lerGovernanca = () => {
  try { return JSON.parse(readFileSync(resolve(process.env.PAGINA || resolve(KIT, 'pagina'), 'governanca.json'), 'utf8')); }
  catch { return null; }   // sem governança, nenhuma ferramenta (falha fechada)
};
const liberada = (gov, nome) => (gov?.ferramentas || []).some(f => f.nome === nome && f.estado === 'ativa' && f.nivel > 0 && f.superficies?.includes('mcp'));

// O estado do serviço fica FORA da fábrica: o protocolo não guarda sessão, o seu serviço guarda o dado.
export const agenda = criarAgenda();
// REGISTRO=<arquivo.jsonl> grava cada chamada, uma linha JSON por chamada.
if (process.env.REGISTRO) aoRegistrar(l => appendFileSync(process.env.REGISTRO, JSON.stringify(l) + '\n'));

const Oficina = z.object({ id: z.string(), titulo: z.string(), tema: z.string(), data: z.string(), vagas: z.int() });
const Confirma = z.object({ confirmar: z.boolean().meta({ title: 'Confirmar a reserva' }) });
const texto = (t, erro = false) => ({ content: [{ type: 'text', text: t }], ...(erro ? { isError: true } : {}) });

// As ferramentas que o CÓDIGO conhece. Quem decide quais saem é o catálogo aprovado (governanca.json).
export const FERRAMENTAS_MCP = [
  {
    nome: 'buscar_oficinas',
    config: {
      title: 'Buscar oficinas',
      description: 'Lista as oficinas da agenda por tema. Só lê: não reserva nada. Use apenasComVaga=true para ver só as que ainda têm vaga.',
      inputSchema: z.object({
        tema: z.enum(TEMAS).optional().describe('Tema da oficina.'),
        apenasComVaga: z.boolean().optional().describe('true = só oficinas com vaga.')
      }),
      outputSchema: z.object({ total: z.int(), oficinas: z.array(Oficina) }),
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false }
    },
    executar: observado('mcp', 'buscar_oficinas', async input => {
      const oficinas = agenda.buscar(input);
      return { content: [{ type: 'text', text: oficinas.map(o => `${o.id} · ${o.titulo} · vagas: ${o.vagas}`).join('\n') || 'nenhuma oficina' }],
        structuredContent: { total: oficinas.length, oficinas } };
    })
  },
  {
    nome: 'reservar_vaga',
    config: {
      title: 'Reservar vaga (pede confirmação)',
      description: 'Reserva uma vaga numa oficina. Tem consequência: pede confirmação ao usuário (MRTR) antes de reservar.',
      inputSchema: z.object({
        id: z.string().regex(/^of-[0-9]{3}$/).describe('Id da oficina, ex.: of-301.'),
        nome: z.string().min(2).max(80).describe('Nome de quem vai participar.')
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
    },
    executar: observado('mcp', 'reservar_vaga', async ({ id, nome }, ctx) => {
      const oficina = agenda.oficina(id);
      if (!oficina) return { ...texto(`oficina não encontrada: ${id}`, true), erro: `oficina não encontrada: ${id}` };
      const resposta = inputResponse(ctx.mcpReq.inputResponses, 'confirmar');
      if (resposta.kind === 'elicit' && resposta.action !== 'accept') return { ...texto('reserva recusada pelo usuário', true), reservado: false };
      const ok = acceptedContent(ctx.mcpReq.inputResponses, 'confirmar', Confirma);
      if (ok?.confirmar !== true) {
        return inputRequired({ inputRequests: {
          confirmar: inputRequired.elicit({ message: `Reservar "${oficina.titulo}" (${oficina.data}) para ${nome}?`, requestedSchema: Confirma })
        } });
      }
      try {
        const reserva = agenda.reservar({ id, nome });
        return { ...texto(`reservado: ${reserva.id} para ${reserva.nome}`), reservado: true };
      } catch (e) { return { ...texto(e.message, true), erro: e.message }; }
    })
  }
];

export function createServer() {
  const server = new McpServer({ name: 'oficinas', version: '1.0.0' });
  const gov = lerGovernanca();   // lido a cada requisição: desligar no arquivo vale na próxima chamada
  for (const f of FERRAMENTAS_MCP) if (liberada(gov, f.nome)) server.registerTool(f.nome, f.config, f.executar);
  return server;
}
