@echo off
cd /d C:\websites\palm-art-studio\site
git add -A
git commit -m "Add Gmail-style email client to admin panel

- AdminInbox.tsx: full email client with dark theme, TipTap rich text editor
- 6 API routes: threads, compose, reply, inbound webhook, drafts, contacts
- lib/email.ts: logEmail, branded HTML template (terracotta/gold)
- Supabase tables: email_accounts, email_messages, email_attachments, email_contacts
- Wired into admin sidebar under Communication group
- Default account seeded: cj@palmartstudio.com"
git push origin main --force-with-lease
