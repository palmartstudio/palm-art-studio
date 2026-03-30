@echo off
cd /d C:\websites\palm-art-studio\site
git add -A
git commit -m "Add hero frame image uploads to Site Editor"
git push origin main --force-with-lease
