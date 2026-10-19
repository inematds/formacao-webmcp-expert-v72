#!/usr/bin/env bash
# capturar.sh — roda cada bloco "Terminal" do curso (kit/blocos/*.sh) e grava a saída em kit/saidas/.
# É daqui que saem as abas "Saída capturada" das aulas. Nenhum bloco chama modelo nem API paga.
# Roda de /tmp com um TMPDIR curto (o Chromium headless recusa caminho de socket longo) e mostra /tmp na saída.
# Uso: bash capturar.sh            # todos menos a2a-clonar (precisa do repo publicado)
#      bash capturar.sh a4a-bateria # um bloco
set -uo pipefail
K=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$K/saidas"
alvos=("$@"); [ ${#alvos[@]} -eq 0 ] && alvos=($(cd "$K/blocos" && ls *.sh | grep -v 'a2a-clonar' | sed 's/\.sh$//'))
for b in "${alvos[@]}"; do
  T=$(mktemp -d /tmp/cwx.XXXX)
  ( cd /tmp && TMPDIR=$T timeout 600 bash "$K/blocos/$b.sh" ) 2>&1 | sed "s#$T#/tmp#g" > "$K/saidas/$b.txt"
  rm -rf "$T"
  echo "$b: $(wc -l < "$K/saidas/$b.txt") linhas · $(tail -1 "$K/saidas/$b.txt")"
done
