@echo off
cd /d C:\websites\palm-art-studio\site
git add -A
git commit -m "Full-screen Gmail-style email client with iframe HTML rendering"
git push origin main --force-with-lease
