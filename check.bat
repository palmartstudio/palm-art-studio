@echo off
cd /d C:\websites\palm-art-studio\site
node -e "try{console.log('FOUND:',require.resolve('tailwindcss'))}catch(e){console.log('MISSING:',e.code)}"
