git clone -q https://github.com/inematds/formacao-webmcp-expert-v72 ~/projetos/formacao-webmcp-expert-v72
cd ~/projetos/formacao-webmcp-expert-v72/kit
npm ci --no-audit --no-fund 2>&1 | tail -2
npx playwright install chromium; echo "saída: $?"
