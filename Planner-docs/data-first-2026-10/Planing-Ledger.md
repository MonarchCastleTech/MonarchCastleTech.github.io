# Çalışma kaydı

## 2026-10-02

- Kullanıcı: veri merkezli Janes/Palantir düzeyinde görsel ciddiyet, Three.js hareketi, The Keep ücretli yaklaşımının kaldırılması ve ürün kimliği bütünlüğü istedi.
- Kullanıcı uygulama öncesi plan ve onay beklenmesini açıkça istedi.
- Yerel klasör ve üst `AGENTS.md` okundu; uygulama checkout'u bulunmadı.
- Janes ve Palantir güncel siteleri tarayıcıda incelendi.
- Ana site ve temsilî ürünlerin canlı arayüzleri incelendi.
- Güncel ana repo ağacı, package.json, rota manifesti ve kaynak mimarisi salt okunur incelendi. Büyük repo için yönergede istenen kaynak keşif alt görevi kullanıldı.
- Three.js'in zaten bulunduğu doğrulandı.
- 24 ürün için repo/dal/teknoloji/canonical yol matrisi oluşturuldu. Tümünde UI kaynağı mevcut; yedi canlı ürün ekranı görsel örnek olarak incelendi.
- Yalnızca bu plan belgeleri oluşturuldu.
- Uygulama, dependency kurulumu, kaynak checkout'u, üretim değişikliği ve yayın: yapılmadı.

Son durum: kullanıcı onayladı; ana site ve 24 ürün doğrulandı.

- 2026-10-02: Implementation validated: main 75 tests, 13 dist checks, 33 browser tests; product collection shell 48 browser checks. Known GeoRisk snapshot-fixture failures documented. Draft PR delivery prepared.

- 2026-10-02: Production publication authorized; product PRs and main PR merged. Live check found stale unversioned assets. Added complete CSS/module revision, passed 76 tests and 14 artifact checks; publishing follow-up fix.
