cd ~/projetos/formacao-webmcp-expert-v72/kit
node scripts/vizinhos.mjs vizinhos/ruim.json | grep -E "PROBLEMA|VIZINHOS"; echo "saída: ${PIPESTATUS[0]}"
