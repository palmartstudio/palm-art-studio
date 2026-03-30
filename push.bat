@echo off
cd /d C:\websites\palm-art-studio\site
git add -A
git commit -m "Phase 1-4: Full Site Editor rebuild with per-page content editing

- New pageContent Sanity schema (Homepage, About, Gallery sections)
- New /api/admin/page-content API route with nested field support
- Rebuilt AdminApp with tabbed Site Editor (Homepage/About/Gallery/Global)
- Removed 6 placeholder tabs (Blog, Community, Email, Inquiries, Collectors)
- Collapsible accordion sections for every editable page section
- Wired HomeClient.tsx to pull all section text from pageContent
- Wired About page to pull all section text from pageContent
- Wired Gallery page CTA banner to pull from pageContent
- Fixed 'Live on Netlify' to 'Live on Vercel' in dashboard
- Updated GROQ queries and schema index"
git push origin main --force-with-lease
