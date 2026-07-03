# Repository Handoff

## Preferred Repository

Use `monarchcastletech/monarchcastletech.github.io` as the canonical GitHub Pages repository when admin access is available.

## Setup Commands

```powershell
git remote add origin https://github.com/monarchcastletech/monarchcastletech.github.io.git
git branch -M main
git push -u origin main
```

If that repository already contains the old site, pull it first, preserve unrelated history, and merge this project as the new root site. Do not overwrite remote history with a force push.

## Pages Settings

Set Pages source to GitHub Actions and custom domain to `monarchcastle.tech`.

## Required Secret State

No runtime secrets are required for the consolidated static site. Dashboard source repositories keep their own data-refresh secrets and workflows.
