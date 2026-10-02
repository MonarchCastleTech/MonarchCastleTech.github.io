# Kabul ölçütleri ve doğrulama

## Kontroller

- Ana sayfada veri keşfi ilk sırada; sektör/satış anlatısı ikinci sırada.
- Katalogdaki 24 frontend kaynağı, kullanılabilir veri ve gerçekten yayımlanan arayüzler ayrı doğrulanmış.
- Veri ailelerinin kaynak, gözlem tarihi, üretim tarihi, ölçek ve durumu görünür.
- Ücretli pilot, fiyat, abonelik, yükseltme ve ticari erişim mesajları site, FAQ, metadata, JSON-LD ve llms metinlerinden kaldırılmış.
- Eski fiyat/pilot yolları yeni ücretsiz girişe tutarlı biçimde yönleniyor.
- Kamuya açık The Keep ekranı ödeme veya kuruluş erişim anahtarı istemiyor.
- Varsa özel kuruluş verileri kamusal ekranlara veya asset'lere çıkmıyor.
- Ortak marka, gezinme, filtre, tablo, açıklama ve hata durumları bütün erişilebilir ürünlerde tutarlı.
- Her ürünün mevcut temel etkileşimleri çalışıyor; kaynak değerleri ve hesaplama yöntemleri korunuyor.
- 375, 768 ve 1440 CSS piksel genişliklerinde veri kontrolleri kullanılabilir; yatay taşma yok.
- Klavye erişimi, görünür odak, veri için metin/tablo alternatifi ve azaltılmış hareket çalışıyor.
- WebGL/import/veri isteği başarısızlığında okunabilir içerik kalıyor.
- Sahne görünmezken duruyor; veri ve HTML önce açılıyor; sahne için ayrılan alan yükleme sırasında sıçramıyor.
- Ekran görüntüleri farklı ürün türlerinde ve viewport'larda karşılaştırılıyor.

## Mevcut ana depo doğrulama komutları

Bu komutlar plan hazırlanırken çalıştırılmadı. Depo ve mevcut bağımlılıklar hazırlandıktan sonra uygulanacak:

```powershell
npm test
npm run build
npm run test:dist
npm run browser:test
node scripts/verify-dist.mjs
node scripts/check-portfolio-sites.mjs
```

`npm test` pretest ile build çalıştırır; yeniden build ancak değişiklik veya ayrı dist doğrulaması gerektiriyorsa yapılır. Upstream'ler değiştiğinde `npm run sync` gereklidir. Governance kaynağı doğrulanırsa `npm run check:content` uygulanır. Yayından sonra `npm run check:live` kullanılabilir. Ayrı ürün depolarında kendi doğrulama komutları kullanılacak. HTTPS enforcement komutu ayar değiştirdiğinden salt okunur doğrulama gibi çalıştırılmayacak.

## Riskler ve açık konular

- Yerel uygulama checkout'u yok; kaynaklara erişim ve depoya özgü talimatlar uygulama öncesi okunacak.
- The Keep backend'i, mevcut özel veri/tenant varlığı ve etkin işlevleri henüz incelenmedi.
- Haricî governance deposu erişilebilir olarak doğrulanmadı. Üretilen içeriğin asıl kaynağıyla tutarlılığı korunmalı.
- Ana repo mount'ları ve ürünlerin kendi Pages yayınları farklı. Kaynakta değişmeyen ürün sonraki deploy'da eski görünümüne dönebilir.
- Farklı puan ölçeklerini tek renk veya toplam skorla birleştirmek yanlış anlam üretebilir. Her aile kendi lejantını koruyacak.
- Ücretsiz arayüz, üçüncü taraf verinin sınırsız yeniden dağıtımı veya sınırsız sunucu işlemi anlamına gelmez; mevcut veri lisansları ve işlev sınırları kayıt düzeyinde gösterilecek.
- Tam veri kalite/model değerlendirme onarımı ayrı bir iştir; bu plan sorunlu veriyi saklamadan görünür kılar.
- Başarı ölçütü, referans firmaların kabiliyetine eşitlik veya doğrulanmamış performans iddiası değildir.
