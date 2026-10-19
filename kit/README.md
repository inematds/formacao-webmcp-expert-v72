# Kit — WebMCP em produção (Formação WebMCP, curso 5 de 6)

A agenda de oficinas do curso 2, agora em produção: uma regra só (`pagina/oficinas.mjs`) servida pela tela, pelo WebMCP na página e por um servidor MCP; registro de chamadas; bateria congelada; vigia de spec; governança com botão de desligar; relatório final. WebMCP = `document.modelContext`, rascunho do W3C Web Machine Learning Community Group de **16/10/2026** (experimental, pode mudar). MCP = revisão **2026-07-28**. Versões fixadas em 19/10/2026.

```bash
cd ~/projetos/formacao-webmcp-expert-v72/kit
npm ci && npx playwright install chromium
node scripts/relatorio.mjs     # as sete verificações e o relatório datado (sem modelo, sem API paga)
```

| Pasta | O que tem |
|---|---|
| `pagina/` | `index.html` + `app.mjs` (tela), `oficinas.mjs` (a regra, a mesma do servidor), `ferramentas.mjs` (WebMCP com detecção e fallback), `registro.mjs` (uma linha por chamada), `governanca.json` (catálogo aprovado), `robots.txt` |
| `servidor/` | `mcp.mjs` (servidor MCP, SDK oficial v2 2.3.1) e `stdio.mjs` (para ligar ao agente da sua assinatura; passo a passo no curso 1) |
| `scripts/` | `camadas`, `superficies`, `observar`, `bateria`, `vizinhos`, `vigiar`, `governanca`, `desligar`, `relatorio`; `copia.sh` faz a cópia descartável dos ensaios |
| `bateria/` | `casos.json` + `contrato.json` congelados (hash em `CONGELADA`) |
| `vigia/` | `base.json` (o que a spec, o Chrome Status e o MCP diziam em 19/10/2026) e a base do curso antigo |
| `vizinhos/` | mapa datado dos protocolos vizinhos e as decisões do site de exemplo |
| `lib/` | `navegador.mjs` (do curso 2: modos `sem`, `polyfill` com `@mcp-b/webmcp-polyfill` 6.0.3 não oficial, `nativo` com `--enable-features=WebMCPTesting`) e `mcp.mjs` (cliente MCP no mesmo processo) |
| `blocos/`, `saidas/`, `capturar.sh` | os blocos "Terminal" do curso e as saídas capturadas |

Curso: https://inematds.github.io/formacao-webmcp-expert-v72/ · conteúdo aberto e gratuito do INEMA.CLUB.
