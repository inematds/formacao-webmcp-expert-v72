cd ~/projetos/formacao-webmcp-expert-v72/kit
E=$(bash scripts/copia.sh a3)
# o erro comum: registrar a entrada inteira "para depurar"
sed -i 's/campos: Object.keys(input).sort()/entrada: input/' $E/pagina/registro.mjs
cd $E && node scripts/observar.mjs nativo | grep "REGISTRO"; echo "saída: ${PIPESTATUS[0]}"
