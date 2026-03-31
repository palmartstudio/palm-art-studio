@echo off
cd /d C:\websites\palm-art-studio\site
git add -A
git commit -m "Mobile email client + proper HTML rendering via mailparser"
git push origin main --force-with-lease
echo PUSH_DONE
