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



## Global historical election model and imagery

The model, validation and history feeds retain source identifiers, dates and citations. The software MIT license does not relicense their inputs. Historical observations are adapted into national shares and, where explicitly labelled, parliamentary seat shares; numerical transformations and inferred residuals are documented in the model source.

- ParlGov: Döring, Quaas, Hesse and Manow (2023), development version. CC0 1.0, as confirmed by the publisher: https://github.com/hdigital/parlgov . Data: https://www.parlgov.org/data/parlgov-development_csv-utf-8/view_election.csv
- Elections Global 2.0: Döring and Düpont. CC0 1.0. Dataset and citation: https://doi.org/10.7910/DVN/OGOURC
- PPEG 2025: Parliamentary election results, version 1. The presidential supplement is quarantined and excluded after a source identity audit. CC0 1.0. Dataset and author citation: https://doi.org/10.7910/DVN/5OAH7P
- Malaysia MECo: Thevesh Thevan and contributors. CC0 1.0, per https://github.com/Thevesh/paper-meco-results/blob/main/LICENSE . Parliamentary candidate votes are aggregated by recorded party; no coalition reclassification is implied.
- Gallup Pakistan / Open Data Pakistan, Pakistan General Elections 1970–2024: Creative Commons Attribution; the publisher does not specify a license version. https://opendata.com.pk/dataset/pakistan-general-elections-1970-2024 . Candidate votes are aggregated by recorded party; independents remain as recorded. Reserved seats are not inferred.
- Lighton Phiri, University of Zambia DataLab, Zambia Electoral Geospatial 1991–2021: CC BY 4.0. https://zenodo.org/records/21709654 . Only verified 2021 presidential vote totals are adapted here.
- Türkiye presidential totals: YSK official returns and the OSCE/ODIHR observation report. Exact source documents are cited in scripts/data/turkiye-presidential.json. The Erdoğan-win scenario is an original preset assumption, not an official result or a conclusion derived from these sources.
- elekt historical results: per-record source provenance and original source terms remain controlling; CC0 / CC BY-SA 4.0 material is attributed in the feed.

Portrait of Recep Tayyip Erdoğan (2023, cropped), Presidency of Azerbaijan, CC BY 4.0: https://commons.wikimedia.org/wiki/File:Portrait_of_Recep_Tayyip_Erdo%C4%9Fan%2C_2023_%28cropped%29.jpg . Image bytes are unchanged; CSS controls display cropping.
Ankara panorama, Wiggum, CC BY-SA 4.0: https://commons.wikimedia.org/wiki/File:Ankara_panorama.jpg . Original bytes are retained, displayed with CSS grayscale and overlays. These images retain their original licenses. See static/sdcofa/election/media/credits.json for details.
