cd ~/projetos/formacao-webmcp-expert-v72/kit
E=${TMPDIR:-/tmp}/ensaio-webmcp-expert/a1; rm -rf $E; mkdir -p $E
node scripts/camadas.mjs $E | tail -1; echo "saída: ${PIPESTATUS[0]}"
