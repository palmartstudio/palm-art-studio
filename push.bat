@echo off
cd /d C:\websites\palm-art-studio\site
git add -A
git commit -m "Email client: IMAP/SMTP via Spacemail, fix build errors"
git push origin main --force-with-lease
