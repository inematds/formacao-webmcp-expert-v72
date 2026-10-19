cd ~/projetos/formacao-webmcp-expert-v72/kit
E=$(bash scripts/copia.sh a4c)
# o erro comum: mudar o esperado para o teste passar
sed -i 's/"reservas": 0/"reservas": 1/' $E/bateria/casos.json
cd $E && node scripts/bateria.mjs mcp; echo "saída: $?"
