# PLANO — WebMCP em produção (Formação WebMCP, curso 5 de 6, o último) · 19/10/2026

Repo `inematds/formacao-webmcp-expert-v72`. Público: quem fez o curso 2 (WebMCP na página) e o 4 (segurança); sai com o projeto final — página + servidor MCP + bateria + relatório — e um plano de manutenção para quando a spec mudar.

Fontes de verdade: rascunho do W3C Web Machine Learning CG de **16/10/2026** (`document.modelContext`); MCP **2026-07-28** (SDK oficial v2 2.3.1); `../wifi/longrun/2026-10-19-formacao-webmcp-v72/{CURRICULO,PESQUISA-ESTADO-DA-ARTE,AUDITORIA-LOCAL,BRIEF-CURSO}.md`; convenções do piloto (`formacao-webmcp-site-v72/PLANO.md` §"Convenções para os cursos irmãos"). Comportamento medido no **Chromium 156.0.8078.4 do Playwright 1.64.0** (nativo = `--enable-features=WebMCPTesting`) e no **@mcp-b/webmcp-polyfill 6.0.3**.

Fora do escopo (só link para o dono): API WebMCP em si (curso 2), servidor MCP, transporte, OAuth e ligar ao Claude Code/Codex (curso 1), agentes de navegador e Playwright/DevTools MCP (curso 3), prompt injection, `exposedTo`, Web Bot Auth (curso 4), evals a fundo (`loop-r-eng-verificacao-v72`), GEO/llms.txt/nota de prontidão (Formação inemaSEO).

## Conferência das fontes (passo 0 do BRIEF)

Legenda: **confere** (com a PESQUISA de 19/10/2026 ou medido no kit) · **velho** (substituído; nunca copiado) · **sem confirmação** (fica fora ou vira "relatado por").

### O que melhorar/atualizar frente ao webmcp-5-expert antigo (regra do Nei)
O curso antigo (`webmcp-5-expert`, commit c1ee007, 05/10/2026) tem 4 módulos publicados (4-1 segurança, 4-2 WebMCP+backend+MCP, 4-3 evals e observabilidade, 4-4 produção e governança) e 12 tópicos só mapeados.
- **Melhorar:** os 4 módulos repetem o mesmo esqueleto em todo tópico ("Antes de modelar… Erro de partida… Indo mais fundo: evidência que vale guardar…", "Matriz mínima de teste" idêntica em todos), com trechos de pseudocódigo soltos (`gate.failIf(...)`, `token = mint(...)`) que não rodam. Nenhuma prática verificável, nenhum kit, nenhum "pronto quando". → Aqui cada aula tem um script do kit que roda sem custo e um "pronto quando" literal.
- **Melhorar:** sem projeto final (a "certificação" do webmcp-1 não tinha prova). → Aula 8 = relatório gerado por `relatorio.mjs` (7 verificações).
- **Atualizar:** snapshot da spec 17/09 → 16/10/2026; lado MCP anterior à 2026-07-28; nenhuma vigia de mudança de API. → Aulas 2, 4 e 6.
- **Segurança** (mod 4-1) agora é do curso 4: aqui só o que a produção precisa (confirmação nas três superfícies, catálogo aprovado, desligar).

### webmcp-5-expert (`curso/expert/modulo-4-{1..4}.html`)
| Afirmação antiga | Marca | O que o curso ensina |
|---|---|---|
| "WebMCP oferece capacidades contextuais; backend guarda regras e autoridade; MCP expõe integrações ao host" (4-2) | confere (princípio) | aula 2, com a mesma regra (`oficinas.mjs`) importada pela página e pelo servidor MCP — medido: `superficies.mjs` → `3/3 iguais` |
| "Clique humano, tool WebMCP e servidor MCP chamam a mesma regra" (4-2) | confere | aula 2; erro comum medido: regra copiada à mão no servidor → `2/3 iguais` |
| `if (needsPageState) return "WebMCP"; if (needsExternalSystem) return "MCP"` (4-2) | confere como ideia, pseudocódigo **velho** | aula 2 vira tabela "onde a ferramenta mora", sem pseudocódigo |
| Lado MCP sem stateless, `server/discover`, MRTR (4-2) | **velho** | MCP 2026-07-28: confirmação por MRTR (`input_required` → cliente pergunta → repete), medido no SDK 2.3.1 |
| `headers: { traceparent, "X-Actor-Id", "X-Delegation-Id" }` (4-2) | **sem confirmação** (cabeçalhos inventados para o exemplo) | fora; aula 3 só registra superfície, ferramenta, resultado, tempo e nomes dos campos |
| "Spans… OpenTelemetry… atributos sanitizados" (4-3) | confere como ideia | aula 3: uma linha JSON por chamada, sem dado pessoal (medido: `dado pessoal no registro: não`); OpenTelemetry citado só como destino possível, sem versão |
| `metrics = { discoveryRecall, correctTool, validArgs, ... }` (4-3) | confere como ideia; métricas de modelo **fora** (evals a fundo = `loop-r-eng-verificacao-v72`) | aula 4: contrato + casos com resultado esperado, sem modelo |
| `gate.failIf(taskSuccess < baseline - 0.02 ...)` (4-3) | **sem confirmação** (número sem fonte) | fora; a bateria falha em qualquer caso que não bate (saída 1) |
| "Baselines versionadas… modelos, prompts, catálogos e navegadores" (4-3) | confere | aula 4: bateria **congelada** (hash em `bateria/CONGELADA`; editar o esperado → `BATERIA RECUSADA`, saída 2) |
| `SLO task_success >= 99.0%`, `p95 tool_latency < 3s` (4-4) | **sem confirmação** (números do exemplo, sem fonte) | fora; aula 7 não recomenda número de SLO |
| `rollout: 1% read-only -> 5% low-risk -> 25% -> 100%` (4-4) | **sem confirmação** (percentuais de exemplo) | aula 7: só o princípio "leitura primeiro, ação com consequência depois", sem percentuais |
| "kill switch: flags.disable("webmcp_mutations"); preserveManualJourney()" (4-4) | confere (ideia) | aula 7: estado `desligada` no `governanca.json` — medido: WebMCP 4→3, MCP 2→1, formulário funcionando |
| `buscar_cursos_v1 → deprecatedAt; v2 → preferred` (4-4) | confere (princípio de versionar contrato) | aula 7: `versao_catalogo` + contrato congelado da aula 4 |
| "matrix: browser × webmcp_surface × agent_provider × journey" (4-4) | confere em parte | aulas 4 e 8: matriz real = sem / polyfill / nativo / mcp |
| Snapshot da spec de 17/09/2026 (`docs/snapshot-especificacao.md`) | **velho** | 16/10/2026; a vigia da aula 6 mostra a diferença ao vivo (`MUDOU spec_data 2026-09-17 → 2026-10-16`) |

### Área `inemaeventos/webmcp/index.html` (§01 e §04, commit c9b36eb)
| Afirmação | Marca | O que entra |
|---|---|---|
| §04: 8 camadas (Descoberta, Ferramentas, Contrato, Estado e erros, Controle, Permissões, Backend e MCP, Evals e observabilidade) | confere (estrutura) | aula 1, cada camada com status em 19/10/2026 e dono na formação nova |
| §04 camada 2: "declarativas, a partir de formulários, e imperativas" | **velho** (rótulo) | declarativa (`toolname`) = **fora da spec**, só no Chrome, experimental em 19/10/2026 (curso 2, aula 6) |
| §04 camada 1 e §05: `llms.txt` como item a publicar | **velho** como promessa | llms.txt = proposta sem efeito medido em citação (PESQUISA §4.2); decisão = Formação inemaSEO |
| §04: "1 e 2 na fase Builder; 3 e 4 na Integrator; 5 e 6 na Agent Developer; 7 e 8 na Expert" | **velho** | mapeamento para os 6 cursos novos (aula 1) |
| §01: "Modelos como o GPT-6 Astra abrem páginas…" | **velho** (nome de modelo) | sem nome de modelo; "o agente que você usa" |
| §01: "O padrão está nascendo agora… atrás de Origin Trial" | confere em parte | WebMCP **não** é padrão: rascunho de CG; origin trial Chrome 149–156, Chrome Status "Proposed" (lido no JSON público em 19/10/2026) |

### webmcp-1-formacao (`docs/arquitetura-dos-repos.md`) e curso-webmcp (`docs/plano_curso_webmcp_zero_ao_expert.md`)
| Afirmação | Marca | O que entra |
|---|---|---|
| 6 repositórios (Formação, Builder, Integrator, Agent Developer, Expert, Agent Hub) | **velho** | 6 cursos por tema (decisions.md de 19/10) |
| "WebMCP Agent Hub" como produto final | **sem confirmação** (nunca publicado) | só a ideia de "projeto que evolui": o kit deste curso é o projeto final |

### constituicao-agentes (`modelo/constituicao-modelo.md` §5, commit 0936e21)
| Afirmação | Marca | Uso |
|---|---|---|
| Níveis de autonomia 3 faz sozinho · 2 faz e avisa · 1 propõe e espera · 0 não toca | confere (modelo do INEMA) | aula 7: campo `nivel` do `governanca.json`; ação com consequência ≤ 1 |

### webmcp-readiness (`test/`, 9ae7d73)
| Afirmação | Marca | Uso |
|---|---|---|
| `static-webmcp.test.mjs` descobre `document.modelContext.registerTool` em bundle e preserva as 4 anotações atuais | confere | aula 4 cita como exemplo de teste congelado de terceiros; a nota/pesos ficam na inemaSEO |

### PESQUISA §4 (protocolos vizinhos) — o que entra
| Item | Marca | Uso |
|---|---|---|
| NLWeb: instância = servidor MCP, método `ask`, Schema.org | confere [FATO no README] | aula 5 |
| NLWeb: adoção | **sem confirmação** | fora ("sem contagem pública") |
| llms.txt: proposta 03/09/2024, modificada 10/08/2026 | confere | aula 5 (mapa) + link inemaSEO |
| llms.txt: ~10% de adoção e nenhuma correlação com citações (SE Ranking) | [2ª] | "relatado pela SE Ranking, não confirmado em 19/10/2026" |
| A2A na Linux Foundation, 150+ organizações (09/04/2026) | confere | aula 5 |
| A2A "v1.0 com agent cards assinados" | **sem confirmação** | fora |
| ACP (OpenAI + Stripe), ChatGPT primeira plataforma | confere [FATO no site] | aula 5 |
| ACP "pivô para descoberta", `/.well-known/acp.json` | [2ª] | fora |
| AP2: Google, 16/09/2025, v0.2 | confere [FATO no site] | aula 5 |
| AP2 doado à FIDO Alliance | [2ª] | "relatado pela cobertura, não confirmado em 19/10/2026" |
| Web Bot Auth: draft IETF -00 (set/2026), RFC 9421 | confere | aula 5 só como camada; dono = curso 4 |
| MCP Registry "currently in preview" | confere | aula 6 (vigiar) só como "preview: não dependa" |

### Itens [incerto]/[2ª] que NÃO entram como fato
Versão do Chrome que removeu o alias `navigator`; data da posição do WebKit; remoção de `provideContext` em mar/2026 (só "não existe na spec de 16/10"); qualquer data de Chrome estável; GA do Claude for Chrome; datas do Atlas e do auto browse; números do OSWorld.

### Chamadas de modelo e API
Nenhuma. O kit lê três páginas públicas sem chave (spec do CG, JSON público do Chrome Status, página de versionamento do MCP) só na aula 6. Imagens: o Codex estava sem crédito em 19/10/2026 (30 tentativas); usado o flux2-klein local (reserva prevista no BRIEF) e o título da capa composto com Pillow.

Baseline dos repos de fonte (não alterados), 19/10/2026: webmcp-1-formacao eb037fb · webmcp-2-builder 676c46e · webmcp-3-integrator 1c81fe8 · webmcp-4-agent-developer f4d8c69 · webmcp-5-expert c1ee007 · webmcp-readiness 9ae7d73 · constituicao-agentes 0936e21 · inemaeventos c9b36eb.

## Kit (`kit/`)
Versões exatas (19/10/2026): `playwright` 1.64.0, `@mcp-b/webmcp-polyfill` 6.0.3, `@modelcontextprotocol/server` e `client` 2.3.1, `zod` 4.6.7. A página e o servidor importam a **mesma** regra (`pagina/oficinas.mjs`, a agenda de oficinas do curso 2). `lib/navegador.mjs` e `scripts/copiar-polyfill.mjs` copiados do piloto. Cliente MCP no mesmo processo (`handler.fetch`, sem porta). Ensaios de erro comum numa cópia descartável (`scripts/copia.sh` → `${TMPDIR:-/tmp}/ensaio-webmcp-expert/<aula>`).

## As 8 aulas
| # | slug | título | objetivo (≤160) | diagrama | prática → pronto quando |
|---|---|---|---|---|---|
| 1 | camadas | Arquitetura em camadas revista com o estado de out/2026 | revisar as 8 camadas com o status de 19/10/2026 e achar no código a evidência de cada uma, no kit e no seu projeto. | escada de 8 camadas (descreve × protege) | `node scripts/camadas.mjs` → `CAMADAS: 8/8 com evidência`, saída 0; pasta vazia → `0/8`, saída 1 |
| 2 | superficies | Uma ação, três superfícies: HTML, WebMCP na página e MCP no servidor | servir a mesma ação pela tela, pelo WebMCP e pelo MCP com uma regra só, e provar que as três respondem igual e pedem a pessoa. | fluxo: pessoa/agente na página/agente fora → mesma regra → mesmo dado | `node scripts/superficies.mjs nativo` → `SUPERFÍCIES: 3/3 iguais na busca · 3/3 reservas esperaram a pessoa` |
| 3 | observar | Observabilidade: registrar chamadas, erros e cancelamentos | registrar cada chamada nas três superfícies com resultado e tempo, sem dado pessoal, e ler os cinco desfechos no log. | fluxo: chamada → embrulho `observado` → linha JSON → resumo | `node scripts/observar.mjs nativo` → `REGISTRO: 8 chamadas · … · dado pessoal no registro: não` |
| 4 | bateria | Bateria congelada e regressão quando a spec muda | congelar contrato e casos das suas ferramentas e ver a bateria pegar a regressão do nome antigo da API. | contrato + casos → hash → 4 modos → regressão | `node scripts/bateria.mjs` → `BATERIA: 24/24 ok`; página com `navigator.modelContext` → `FALHA`, saída 1 |
| 5 | vizinhos | Protocolos vizinhos como mapa: A2A, ACP, AP2, NLWeb, llms.txt | situar cada protocolo vizinho na camada certa com status datado e decidir adotar, esperar ou não se aplica, com motivo. | mapa por camada (página, servidor, descoberta, agente↔agente, pagamento, identidade) | `node scripts/vizinhos.mjs` → `8 decisões · 0 problema(s)`; o ruim → `4 problema(s)` |
| 6 | vigiar | Viver com API que muda: vigiar spec, Chrome Status e MCP | gravar a base do dia em que a bateria passou e vigiar spec, Chrome Status e MCP, com o caso navigator → document como exemplo. | linha do tempo: explainer → PR #177 (19/05) → spec 16/10 → OT até 156 | `node scripts/vigiar.mjs` → `VIGIA: 7/7 iguais à base` (ou `MUDOU`, saída 1); base do curso antigo → `MUDOU spec_data` |
| 7 | governanca | Produção e governança: aprovar, versionar e desligar rápido | pôr cada ferramenta num catálogo com dono, data e nível de autonomia, e desligar uma sem deploy de código nem quebrar o formulário. | fluxo: proposta → aprovação (nível) → ativa → desligada | `node scripts/governanca.mjs` → `0 problema(s)`; `desligar.mjs reservar_vaga` → `DESLIGAR: ok` |
| 8 | projeto | Projeto final: seu site, servidor, bateria e relatório | juntar as sete verificações num relatório datado do seu site e sair com o plano de manutenção para quando a spec mudar. | mapa 4 degraus + gerador | `node scripts/relatorio.mjs` → `RELATÓRIO: 7/7 verificações ok → relatorio/RELATORIO-AAAA-MM-DD.md` |

Última aula: `inicio.cursos` com os 6 cursos e links para os irmãos; curso 3 (`formacao-webmcp-navegador-v72`) e 4 (`formacao-webmcp-seguranca-v72`) ainda não publicados em 19/10/2026 — link mantido. Vídeo: nenhum (o short WebMCP é do curso 0).

## Desvios do CURRICULO (com motivo)
- Aula 4 aponta para a bateria do curso 3 e o checklist do curso 4 por link, mas tem bateria própria: os dois cursos ainda não estavam publicados em 19/10/2026 e a bateria daqui cobre WebMCP + MCP juntos.
- Aula 3 não usa OpenTelemetry nem cabeçalhos de rastreio (o antigo não tinha fonte para versão nem para os cabeçalhos); o registro é JSONL simples.
