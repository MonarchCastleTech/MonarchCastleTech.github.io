# Global SDCofA Election Atlas

Production: https://monarchcastle.com/sdcofa/election/

The country stage follows the reference's full-screen country-map, glass election-card, purple accent, portrait context and country-carousel composition. All geometry, styling and code are independent. Default view: Türkiye. Every country/territory in the calendar has a searchable profile, with additional electoral-jurisdiction profiles where historical data are available. Profile inclusion is not a sovereignty determination. Raw poll tables and charts are removed from the public page.

## Independent models

`python scripts/sync-election-world.py` fetches free national-result records from elekt and incorporates ParlGov's long parliamentary series (CC0, as confirmed in the publisher's hdigital/parlgov README). Additional historical coverage comes from Elections Global 2.0 and PPEG 2025 parliamentary results (CC0), Malaysia MECo (CC0), Gallup Pakistan / Open Data Pakistan (CC BY, version unspecified), and Lighton Phiri / University of Zambia DataLab (CC BY 4.0). Provider URLs and licenses are embedded in feed metadata and individual records. It preserves original-source links and distinguishes presidential alignments, parliamentary vote shares, and reported parliamentary seat shares. Indirect and single-field elections are not assigned invented competitive winners. Missing and stale series remain explicit coverage states. Numerical coverage is counted from the generated artifact, not assumed from the number of countries in the selector.

Each country/election-family/provider series is evaluated separately. New estimates use the provider of the latest result and only its comparable history; an older provider's tests do not validate a newer provider baseline. This prevents an untranslated or renamed party label at a provider boundary from being counted as a 100-point electoral swing. The model uses the last election's share distribution, optionally extrapolating the preceding change with weights 0, .15, .3 or .5. Each historical target uses only preceding elections. At each target date, the momentum weight is chosen using only earlier target dates; elections on the same day cannot train each other. Before thirty training trials, it uses the continuity baseline. The retrospective evaluation starts in 1990. The current full-history share-error optimum is weight zero: the model therefore selects the continuity baseline rather than claiming unobserved improvement. The report displays the adaptive model and a last-election reference side by side.

This is a reconstructed retrospective test, not a ledger of archived forecasts issued before elections. Source revisions, identity harmonisation, party mergers, new parties and candidate changes limit generalisation. No calibrated winner probabilities are published. The descriptive error range is the retrospective 90th-percentile absolute leader-share error; it is not a validated prediction interval. Parliamentary vote/seat leaders do not determine government control. A single historical result is a labelled baseline; local holdout counts and pooled error references are exposed separately.

## Türkiye 2028

The requested fixed Erdoğan victory is implemented only as an explicit preset scenario. The headline is “Erdoğan wins.” with a visible “PRESET SCENARIO · NOT A FORECAST” label. It assumes candidacy and victory, assigns no model probability and is excluded from training and all backtest statistics. It does not override the independent model. Presidential source curation covers the decisive 2014, 2018 and 2023 ballots, regrouped as Erdoğan-aligned versus all other candidates, with YSK/OSCE citations in `scripts/data/turkiye-presidential.json`. One reconstructed presidential holdout is insufficient to validate a Türkiye presidential forecasting system.

## Result calls and updates

The existing OpenRouter pipeline now reviews election-night returns only. Future country estimates come from the deterministic world model, not language-model winner selection. Free variants and `openrouter/free` are the only configured routing choices; there is no paid fallback. `OPENROUTER_API_KEY` remains an encrypted GitHub Actions secret and is never included in public files. Existing conservative result-call criteria and correction history remain separate from future models.

The main repository's hourly Pages workflow refreshes the calendar, reviews eligible result calls and generates world models before building. Final-result details are cached by source revision and normalized history is recovered from the deployed artifact when available. A failed model refresh preserves its timestamp and shows an error. Data are public snapshots, not minute-by-minute live coverage. Raw polling adapters are retained for compatibility/research but no poll observations are rendered by the new app.

## Assets, licences and verification

Natural Earth outlines are public domain. The unmodified Erdoğan portrait is credited to the Presidency of Azerbaijan (CC BY 4.0); the Ankara panorama is by Wiggum (CC BY-SA 4.0). Original URLs and display changes are recorded in `static/sdcofa/election/media/credits.json`. National flags are served by FlagCDN. IBM Plex is bundled locally. elekt data preserve CC0 / CC BY-SA 4.0 and original-source terms. ParlGov authors and its 2023 development version are credited in the UI.

Run `node --test tests/election-world.test.mjs`, `python tests/test_election_world.py`, `npm test`, `npm run test:dist`, and `node scripts/verify-dist.mjs`. Browser QA covers desktop/mobile layouts, country selection, unavailable-state honesty, scenario separation, calendar export and backtest filters. The source is deployed through the existing MonarchCastleTech main Pages site; no domain changes are required.

PPEG presidential records are quarantined after an audit found a candidate-to-party mismatch in the published source (Armenia 2013). They do not enter history, forecasts or evaluation. Parliamentary PPEG records remain a separately normalized input.
