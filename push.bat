@echo off
cd /d C:\websites\palm-art-studio\site
git add -A
git commit -m "shared NavClient, mobile nav fix all pages, GSAP upgrades, mobile layouts"
git push origin main
echo EXIT: %ERRORLEVEL%
