@echo off
cd /d C:\websites\palm-art-studio\site
git add -A
git commit -m "Fix Site Editor: crash on About tab and empty fields"
git push origin main --force-with-lease
