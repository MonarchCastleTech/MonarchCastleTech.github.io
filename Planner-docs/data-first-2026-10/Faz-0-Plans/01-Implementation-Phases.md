# Uygulama aşamaları

## 1. Kaynak ve ürün envanteri

Yaklaşım: ana depo, tüm katalog kayıtları ve The Keep erişim kaynağı eşlenecek. Tüm 24 kayıtta frontend var; canonical URL'de çalışan UI, kaynak ağacı ve feed'in analitik kapsamı ayrı tutulacak. Her ürün için veri ve etkileşimler başlangıç ekranlarıyla kaydedilecek.

Etkilenen plan kaydı: ürün matrisi ve mevcut durum raporu. Asıl kod bu araştırma sırasında değişmeyecek.

Başarı: 24 katalog kaydının repo/URL/teknoloji/yayın durumu doğrulanmış; ayrı ürün testleri ve doğrulama komutları belirlenmiş.

## 2. Tasarım sistemi ve üç düzen

Yaklaşım: ortak marka ve bileşen kuralları; atlas, analitik panel ve metin/kılavuz düzenlerine uygulanacak. İlk referans düzen WTI olacak; karmaşık atlas davranışı EconMap veya ESGMap ile kontrol edilecek.

Muhtemel kaynaklar: `src/styles/site.css`, `src/styles/identity.css`; gerekirse tek bir sürümlü tasarım sistemi kaynağı. Ayrı UI'lar mevcut framework'lerini koruyacak.

Başarı: renk/typography/spacing/focus/data-state kuralları tanımlı ve farklı düzenlerde okunabilir.

## 3. Ana sayfa ve veri atlası

Yaklaşım: `build-site.mjs` içindeki home renderer ve ilgili içerikler veri önceliğine taşınacak; mevcut Three.js sahnesi kayıtlarla ilişkili atlas etkileşimine geliştirilecek. Kanıtı bulunmayan çizgiler ve etiketler veri gibi çizilmeyecek.

Kaynaklar: `src/scripts/hero-loader.js`, `src/scripts/hero-scene.js`, `scripts/build-site.mjs`, `src/content/editorial.json`, ortak stiller ve gerektiği ölçüde `site.routes.json`.

Başarı: ülke/veri seçimi kaynağa açılıyor; yükleme ve WebGL failure içerik kullanımını engellemiyor.

## 4. Ücretsiz The Keep ve ticari içeriğin kaldırılması

Yaklaşım: fiyat/pilot rotaları ve ticari bağlantılar yeni ücretsiz kamusal girişe bağlanacak. Renderer, içerik, structured data ve üretilen metinler aynı karar etrafında güncellenecek. The Keep kaynaklarında yetki ve veri sınırları incelendikten sonra kamusal görünüm uygulanacak.

Kaynaklar: `site.routes.json`, `scripts/build-site.mjs`, `src/content/editorial.json`, `src/content/site.json` ve asıl registry kaynağı varsa o kayıtlar; `docs/architecture/the-keep.md`, `docs/business/*`, `docs/legal/pilot-sow-template.md`, `.github/ISSUE_TEMPLATE/pilot_request.yml`; ilgili renderer/route/content/dist/browser testleri.

Başarı: ücretli kullanım dili ve teklifler kalkmış; kamusal ekran ücretsiz açılıyor; özel veri korunuyor; old-route testleri yeni erişim kurallarını doğruluyor.

## 5. Ürün kaynaklarına yayılım

Yaklaşım: ortak kabuk ve bileşenler her ürünün asıl deposuna uygulanacak. Ana sitenin build çıktısına yapılan geçici overrides çözüm sayılmayacak. Sürüm sabitlemesiyle ortak varlıklar build sırasında paketlenecek; çalışma anında değişken bir merkezi CSS dosyasına bağımlılık kurulmayacak.

Sıra: WTI/MENA/BNTI; EconMap/ESGMap/MacroIntel; diğer analitik paneller; PrepTürk/Süper Lig/teknik demolar; diğer SDCofA haber ve araştırma arayüzleri.

Başarı: sonraki ürün rebuild'i kimliği koruyor; fonksiyonel ve veri regresyonu yok; haber akışı ve sayısal endeks farkı açıkça tanımlanıyor.

## 6. Doğrulama ve teslim

Yaklaşım: mevcut testlere yeni yönlendirme, ücretsiz erişim ve ortak kimlik beklentileri uygulanacak. Kritik veri etkileşimleri, animasyon fallback'leri ve kaynak bağlantıları gerçek ekranlarla doğrulanacak.

Komutlar: `npm test`, gerektiğinde `npm run build`, `npm run test:dist`, `npm run browser:test`, `node scripts/verify-dist.mjs`; ürün başına mevcut komutlar. Yeni bağımlılık gerekiyorsa kapsam ve izin kullanıcı onayıyla belirlenecek. Three.js zaten bulunduğu için yeniden eklenmeyecek.

Başarı: kabul tablosu tamamlanmış, önizleme ve kanıt ekranları hazır. Yayın/push henüz yetkilendirilmiş değildir; bu plan yalnızca uygulama kapsamının onayına sunuluyor.
