@echo off
git reset --soft HEAD~1
git add .
git commit -m "Merged backend into Next.js and removed secrets"
git push origin main
