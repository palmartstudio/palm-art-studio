@echo off
cd /d C:\websites\palm-art-studio\site
echo === GIT STATUS ===
git status --short
echo === LAST 3 COMMITS ===
git log --oneline -3
