// Copia o polyfill (@mcp-b/webmcp-polyfill 6.0.3, MIT) para pagina/vendor/ — só para o ensaio (?ensaio=polyfill).
// O pacote é uma distribuição temporária do polyfill do W3C Community Group (não oficial, "will eventually be removed").
import { copyFileSync, mkdirSync } from 'node:fs';
const origem = new URL('../node_modules/@mcp-b/webmcp-polyfill/dist/index.iife.js', import.meta.url);
const destino = new URL('../pagina/vendor/webmcp-polyfill.js', import.meta.url);
mkdirSync(new URL('../pagina/vendor/', import.meta.url), { recursive: true });
copyFileSync(origem, destino);
console.log('polyfill copiado para pagina/vendor/webmcp-polyfill.js');
