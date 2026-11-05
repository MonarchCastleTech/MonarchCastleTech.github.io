# Election Atlas

Production route: https://monarchcastle.com/sdcofa/election/

The owned static route is deployed by the main MonarchCastleTech GitHub Pages build. The edge serves this route before its legacy SDCofA fallback. No DNS or legacy forecast API changes are needed.

Run `node scripts/sync-election.mjs` to refresh feeds. The existing hourly Pages workflow runs this before building. Calendar pagination includes both upcoming and campaign phases. Feed requests run independently; failed feeds recover a newer last-deployed snapshot when available, otherwise retain the checked-in successful snapshot, preserve its original timestamp, and publish a failure status. If a feed has no fallback, the build fails. Repeated failures are visible as aging snapshots in the UI. GitHub scheduling and upstream availability determine actual publication time.

Calendar: elekt public API, national scope including territories, referendums and indirect elections. This is upstream coverage, not a guarantee of exhaustive global/local coverage. Date precision and evidence status are retained. Only sourced, day-precise scheduled/snap dates receive countdowns and .ics export. Export follows current filters and is a one-time download, not a subscription. Countries without dates remain searchable.

Polling: DAWUM, federal and state polls published in the last 180 days; Election Wrld / VoteHub, published 2026 US polls. Missing countries show no invented polling. Charts connect individual polls by fieldwork end date within 90 days of the latest observation. They are not averages, predictions, seat estimates, or probabilities. Historic races retain their race labels. Missing metadata is labelled.

Licensing remains separate for each snapshot: German derived polling database ODbL 1.0 (https://opendatacommons.org/licenses/odbl/1-0/), credit dawum.de; US data CC BY 4.0, credit VoteHub / Election Wrld; calendar sources CC0 / CC BY-SA 4.0 with upstream provenance retained via each record's API link. Natural Earth world outlines are public domain and reuse the existing owned map asset. Flag images use FlagCDN and no analytics or credentials. The app uses the existing local IBM Plex font.

No OpenRouter account or API key is needed or stored. All feeds are fetched at build time. The browser loads same-origin snapshots, so visitors don't depend on third-party API CORS or expose credentials.

Verification: `node --test tests/election-data.test.mjs`, the existing site suite, built-artifact checks, plus desktop/mobile browser inspection. Source URLs and licenses appear in the Sources tab and JSON snapshots.
