#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/music-tests
"${JAVA_HOME:+$JAVA_HOME/bin/}javac" -encoding UTF-8 -d out/music-tests \
  app/src/io/freemytv/MusicPlayback.java tests/MusicPlaybackTest.java
"${JAVA_HOME:+$JAVA_HOME/bin/}java" -cp out/music-tests io.freemytv.MusicPlaybackTest
