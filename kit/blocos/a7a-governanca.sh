cd ~/projetos/formacao-webmcp-expert-v72/kit
node scripts/governanca.mjs; echo "saída: $?"
node scripts/governanca.mjs governanca/ruim.json | grep -E "PROBLEMA|GOVERN"; echo "saída: ${PIPESTATUS[0]}"
