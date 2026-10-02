# Ürün kaynak envanteri

2 Ekim 2026. Katalog snapshot: `src/content/site.json`, ana repo ağacı `5ecd67907abbe8739b6ad402e3c22826654e9d2f`.

24 kayıt: 14 MonarchCastleTech, 10 SDCofA. Tümünde frontend kaynağı ve GitHub Pages yapılandırması var. Bu, canonical adreste arayüzün sorunsuz yayımlandığını tek başına kanıtlamaz. Canlı ekran sütunu yalnızca bu görüşmede yapılan görsel örnek incelemesini gösterir; tam fonksiyon testi değildir.

Repo sütunundaki kimlikler `https://github.com/` altında bulunur. Varsayılan dallar depo metadata'sıyla doğrulandı. Teknolojiler kaynak manifestlerinden belirlendi.

| Ürün | Repo | Dal | Kaynak teknolojisi | Katalogdaki canonical yol | Canlı ekran |
| --- | --- | --- | --- | --- | --- |
| Caspian & Black Sea Monitor | MonarchCastleTech/caspian-black-sea-monitor | main | Statik HTML | /caspian-black-sea-monitor/ | Bekliyor |
| Climate Security News Monitor | SDCofA/climate-security-index | main | Statik HTML | /sdcofa/climate-security-index/ | Bekliyor |
| Cloudy&Shiny Index | MonarchCastleTech/Cloudy-Shiny | main | Statik HTML ve template | /Cloudy-Shiny/ | İncelendi |
| Conflict News Monitor | SDCofA/conflict-early-warning | main | Statik HTML | /sdcofa/conflict-early-warning/ | Bekliyor |
| Cyber Threat News Monitor | SDCofA/cyber-exposure-map | main | Statik HTML | /sdcofa/cyber-exposure-map/ | Bekliyor |
| Defense Procurement Intelligence | MonarchCastleTech/defense-procurement | main | Statik HTML | /defense-procurement/ | Bekliyor |
| EconMap | MonarchCastleTech/econmap | main | Next.js / React / MapLibre | /econmap/ | İncelendi |
| ESGMap | MonarchCastleTech/esgmap | master | Vite / React | /esgmap/ | İncelendi |
| MacroIntel | MonarchCastleTech/macrointel | main | Statik HTML | /macrointel/ | İncelendi |
| MENA Energy Flow Tracker | MonarchCastleTech/mena-energy-flow | main | Statik HTML | /mena-energy-flow/ | Bekliyor |
| MILCODEC Receiver | MonarchCastleTech/milcodec-receiver | main | Statik HTML | /milcodec-receiver/ | Bekliyor |
| Nuclear Energy Intelligence | MonarchCastleTech/NuclearEnergyIntelligence | main | Vite / React / Leaflet | /NuclearEnergyIntelligence/ | Bekliyor |
| Nuclear Policy News Monitor | SDCofA/nuclear-proliferation-watch | main | Statik HTML | /sdcofa/nuclear-proliferation-watch/ | Bekliyor |
| Port Congestion Pulse | MonarchCastleTech/port-congestion-pulse | main | Statik HTML | /port-congestion-pulse/ | Bekliyor |
| PrepTurk | MonarchCastleTech/prepturk | master | Statik yayın; Next.js / React / Leaflet uygulama kaynağı da var | /prepturk/ | İncelendi |
| Sanctions News Monitor | SDCofA/sanctions-exposure-index | main | Statik HTML | /sdcofa/sanctions-exposure-index/ | Bekliyor |
| Süper Lig Forecast | MonarchCastleTech/superlig-forecast | main | Vite / React | /superlig-forecast/ | Bekliyor |
| Supply Chain Intelligence | MonarchCastleTech/supplychain | master | Statik HTML | /supplychain/ | Bekliyor |
| Türkiye Economic Sentiment Radar | MonarchCastleTech/tr-economic-sentiment | main | Statik HTML | /tr-economic-sentiment/ | Bekliyor |
| Border Neighbor Threat Index | SDCofA/border-neighbor-threat-index | main | Statik HTML | /sdcofa/bnti/ | Bekliyor |
| MENA Threat Index | SDCofA/mena-threat-index | main | Statik HTML | /sdcofa/mena/ | İncelendi |
| World Threat Index | SDCofA/world-threat-index | main | Statik HTML | /sdcofa/wti/ | İncelendi |
| Election Monitor | SDCofA/election | master | Next.js / React | /sdcofa/election/ | Bekliyor |
| GeoRisk | SDCofA/georisk | main | Next.js / React | /sdcofa/georisk/ | Bekliyor |

## Envanterin sonraki adımı

Her canonical adres tarayıcıyla tek tek doğrulanacak. Ana repo yalnızca BNTI, MENA ve WTI'yi dashboard mount olarak tanımlıyor. Diğer yolların gerçek hosting ve yönlendirme ilişkisi ayrıca çıkarılacak. Bu ortamda shell HTTP isteklerinin tüm canonical adreslerde 403 dönmesi, tarayıcıda açılan örnekler için de geçerli olduğundan kırık rota kanıtı olarak kullanılmadı.

Election yöntem bağlantısında `blob/main/README.md` kullanılıyor; deponun doğrulanan dalı `master`. Bu bağlantı envanterde düzeltme adayıdır. PrepTurk'te yayımlanan statik kaynak ile daha geniş uygulama kaynağı ayrı kapsamdır.
