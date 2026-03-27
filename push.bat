@echo off
cd /d C:\websites\palm-art-studio\site
git add -A
git commit -m "add admin PWA, api routes, supabase lib, manifest"
git push origin main
echo DONE
