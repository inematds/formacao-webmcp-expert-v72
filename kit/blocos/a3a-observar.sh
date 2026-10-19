cd ~/projetos/formacao-webmcp-expert-v72/kit
node scripts/observar.mjs nativo; echo "saída: $?"
tail -1 logs/chamadas.jsonl
