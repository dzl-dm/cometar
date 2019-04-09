#!/bin/bash

startdir=$PWD
dir=$(dirname $(realpath $0))
"$dir/generation.sh"

source "$dir/config.cfg"
rm -rf "$TEMPDIR"
mkdir -p "$TEMPDIR/git"
git clone -q "$TTLDIRECTORY" "$TEMPDIR/git"
"$dir/../../repository/provenance/write_provenance.sh" -p "$dir/config.cfg"

"$dir/comparison.sh"