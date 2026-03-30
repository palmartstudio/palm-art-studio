@echo off
cd /d C:\websites\palm-art-studio\site
git add -A
git commit -m "Add PWA support: manifest, service worker, icons, installable app"
git push origin main --force-with-lease
