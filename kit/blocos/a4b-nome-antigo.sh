cd ~/projetos/formacao-webmcp-expert-v72/kit
E=$(bash scripts/copia.sh a4)
# a regressão: alguém cola um exemplo antigo que usa o nome de antes de 19/05/2026
sed -i 's/const mc = document.modelContext; /const mc = navigator.modelContext; /' $E/pagina/ferramentas.mjs
cd $E && node scripts/bateria.mjs sem nativo | grep -E "FALHA|ok    \[sem\]|BATERIA"; echo "saída: ${PIPESTATUS[0]}"
