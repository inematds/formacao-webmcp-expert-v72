// stdio.mjs — serve o servidor da agenda por stdio, para ligar ao agente da sua assinatura
// (claude mcp add / codex mcp add: passo a passo no curso 1, formacao-webmcp-mcp-v72, aula 8).
// stdout é o canal do protocolo: log vai para stderr. REGISTRO=<arquivo.jsonl> grava as chamadas.
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createServer } from './mcp.mjs';

serveStdio(createServer);
console.error('oficinas: servidor MCP no stdio');
