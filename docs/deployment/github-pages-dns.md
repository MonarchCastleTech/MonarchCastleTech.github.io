# monarchcastle.tech GitHub Pages DNS Handoff

Canonical host: `monarchcastle.tech`

GitHub Pages repository: `monarchcastletech.github.io` unless implementation chooses a different repository with admin access.

## GitHub Settings

1. Open repository Settings.
2. Go to Pages.
3. Set Source to GitHub Actions.
4. Set Custom domain to `monarchcastle.tech`.
5. Wait for DNS check to pass.
6. Enable Enforce HTTPS when GitHub allows it.

## Registrar DNS Records

Remove default parking records that conflict with the apex or `www`.

Create these apex `A` records:

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

Optional IPv6 records:

| Type | Host | Value |
| --- | --- | --- |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |

Create the `www` record:

| Type | Host | Value |
| --- | --- | --- |
| CNAME | www | monarchcastletech.github.io |

Do not create wildcard records for `*.monarchcastle.tech`.

## Verification Commands

```powershell
Resolve-DnsName monarchcastle.tech -Type A
Resolve-DnsName www.monarchcastle.tech -Type CNAME
```

Expected apex `A` answers are the four GitHub Pages IP addresses above. Expected `www` CNAME target is `monarchcastletech.github.io`.
