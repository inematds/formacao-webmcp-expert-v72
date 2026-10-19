// mcp.mjs — liga um cliente MCP ao servidor da agenda NO MESMO PROCESSO (handler.fetch, sem porta).
// Cliente e servidor: SDK oficial v2 2.3.1. versionNegotiation 'auto' = pergunta server/discover (revisão 2026-07-28).
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createServer } from '../servidor/mcp.mjs';

// resposta: 'sim' | 'nao' — o que o "usuário" responde quando o servidor pede confirmação (MRTR).
export async function ligarMcp({ resposta = 'sim' } = {}) {
  const handler = createMcpHandler(createServer);
  const cliente = new Client({ name: 'kit-producao', version: '1.0.0' },
    { versionNegotiation: { mode: 'auto' }, capabilities: { elicitation: { form: {} } } });
  const perguntas = [];
  cliente.setRequestHandler('elicitation/create', async req => {
    perguntas.push(req.params.message);
    return resposta === 'sim' ? { action: 'accept', content: { confirmar: true } } : { action: 'decline' };
  });
  await cliente.connect(new StreamableHTTPClientTransport(new URL('http://kit.local/mcp'),
    { fetch: (url, init) => handler.fetch(new Request(url, init)) }));
  return {
    cliente, perguntas,
    era: cliente.getProtocolEra(),
    async ferramentas() { return (await cliente.listTools()).tools; },
    async chamar(name, args) { return cliente.callTool({ name, arguments: args }); },
    async fechar() { await cliente.close(); await handler.close(); }
  };
}

// Versão que o servidor anuncia em server/discover (sem cliente: um POST cru, como o curso 1 mostra com curl).
export async function versaoAnunciada() {
  const handler = createMcpHandler(createServer);
  const r = await handler.fetch(new Request('http://kit.local/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
      'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': 'server/discover' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'server/discover', params: { _meta: {
      'io.modelcontextprotocol/protocolVersion': '2026-07-28',
      'io.modelcontextprotocol/clientInfo': { name: 'vigia', version: '1.0.0' },
      'io.modelcontextprotocol/clientCapabilities': {} } } })
  }));
  const j = await r.json();
  await handler.close();
  return j.result?.supportedVersions || [];
}
