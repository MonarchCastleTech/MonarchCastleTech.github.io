# Third-party notices

## Scope of the root license

The root `LICENSE` applies to original software and documentation contributed to this repository under MIT. It does **not** grant rights to third-party datasets, reports, model outputs, fonts, maps, screenshots, trademarks, or other externally sourced assets.

Monarch Castle Technologies and Strategic Data Company of Ankara names and logos are brand assets; no trademark permission is granted by the software license.

## Data and asset review

Review [site.routes.json](site.routes.json) and source metadata embedded with any dataset before copying or redistributing it. Upstream terms, attribution requirements, and source dates remain controlling. Absence of a separate data-license file must not be interpreted as a public-domain or MIT declaration.

Rights review: Git shortlog attributes human-authored site history to Arda Akgul; high-volume deployment commits are organization automation.

Reviewed exclusions:

- upstream product copies and externally sourced content
- logos, trademarks, screenshots, fonts, and external assets

Generated analytical outputs can inherit restrictions or attribution duties from their inputs. Contributors must document a source and applicable terms before adding a third-party dataset or asset.

## Public design assets, 2026.10

IBM Plex Sans and Mono are redistributed under SIL OFL 1.1; see src/assets/fonts/OFL.txt. Font copyright and licence text are preserved. Country geometry comes from Natural Earth 110m via the topology vendored in ESGMap; see src/assets/geo/README.md for source and interpretation boundaries.
# Election Atlas data

The election calendar snapshot under `static/sdcofa/election/feeds/calendar.json` is sourced from elekt (https://elekt.io/), with official sources, Wikidata (CC0), and Wikipedia (CC BY-SA 4.0). Calendar reuse is attributed to elekt and the linked provenance records; the adaptation is available under CC BY-SA 4.0 where applicable (https://creativecommons.org/licenses/by-sa/4.0/).

The separate derived German polling database `static/sdcofa/election/feeds/germany.json` is provided under ODbL 1.0 (https://opendatacommons.org/licenses/odbl/1-0/). Data: dawum.de (https://dawum.de/API/). It is not covered by the repository's MIT code license.

The US polling snapshot `static/sdcofa/election/feeds/us.json` credits VoteHub (https://votehub.com/polls/api/) and Election Wrld (https://www.electionwrld.com/developers), CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Original pollster links remain in the records. Underlying source terms apply.

Election Atlas reuses the existing Natural Earth public-domain country outlines and local IBM Plex fonts. National flag SVG images are served by FlagCDN (https://flagcdn.com/).

