#!/usr/bin/env bash
# copia.sh <nome> — cópia descartável do kit em ${TMPDIR:-/tmp}/ensaio-webmcp-expert/<nome>,
# com node_modules por link. Os ensaios de "erro comum" mexem na cópia, nunca no kit. Imprime o caminho.
K=$(cd "$(dirname "$0")/.." && pwd); E=${TMPDIR:-/tmp}/ensaio-webmcp-expert/${1:?nome}
rm -rf "$E"; mkdir -p "$E"
cp -r "$K"/{lib,pagina,servidor,scripts,bateria,vigia,vizinhos,governanca,package.json} "$E"/
ln -s "$K/node_modules" "$E/node_modules"
echo "$E"
