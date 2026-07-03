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

Configure GitHub Pages in this order:

1. Open repository Settings > Pages.
2. Set Source to `GitHub Actions`.
3. After the Pages workflow is configured, set Custom domain to `monarchcastle.tech`.
4. Wait for GitHub Pages to finish the DNS check.
5. Enable Enforce HTTPS when GitHub makes it available.

## DNS Cutover

Remove parking or forwarding records that conflict with the apex or `www`, then create these records for GitHub Pages:

### Apex records

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

### `www` record

| Type | Host | Value |
| --- | --- | --- |
| CNAME | www | monarchcastletech.github.io |

Optional IPv6 support can mirror the GitHub Pages AAAA records documented in `docs/deployment/github-pages-dns.md`.

## Verification

Verify the publish artifact before or immediately after cutover:

```powershell
Get-Content dist/CNAME
```

Expected output: exactly `monarchcastle.tech`

Verify DNS after the registrar changes propagate:

```powershell
Resolve-DnsName monarchcastle.tech -Type A
Resolve-DnsName www.monarchcastle.tech -Type CNAME
```

Expected apex `A` answers are the four GitHub Pages IP addresses above. Expected `www` CNAME target is `monarchcastletech.github.io`.

## Required Secret State

No runtime secrets are required for the consolidated static site. Dashboard source repositories keep their own data-refresh secrets and workflows.
