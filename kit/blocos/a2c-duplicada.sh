cd ~/projetos/formacao-webmcp-expert-v72/kit
E=$(bash scripts/copia.sh a2)
# o erro comum: copiar a regra à mão no servidor (e esquecer o filtro de vaga)
sed -i 's/const oficinas = agenda.buscar(input);/const oficinas = agenda.buscar({}).filter(o => !input.tema || o.tema === input.tema);/' $E/servidor/mcp.mjs
cd $E && node scripts/superficies.mjs nativo | grep -E "→ of|SUPERF"; echo "saída: ${PIPESTATUS[0]}"
