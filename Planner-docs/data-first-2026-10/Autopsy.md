# Mevcut durum incelemesi

2 Ekim 2026. Canlı site ve kamuya açık kaynakların salt okunur incelemesi.

## Doğrulanan bulgular

- Yerel `C:\Users\akgul\Downloads\MCT` klasörü başlangıçta boştu.
- Ana repo güncel API ağacında 132 dosya içeriyor. Ağaç SHA: `5ecd67907abbe8739b6ad402e3c22826654e9d2f`.
- Ana site özel Node.js statik renderer kullanıyor. Three.js ve esbuild zaten bağımlılık olarak bulunuyor; tasarım değişimi için framework dönüşümü gerekmiyor.
- Three.js sahnesi prosedürel tel-kafes, düğüm ve yay hareketlerinden oluşuyor. Yükleyici geniş ekran ve azaltılmış hareket koşullarını kontrol ediyor; statik SVG fallback, görünürlükte durdurma ve DPR sınırı mevcut.
- Ortak anlatı sayfaları `build-site.mjs`, `site.css` ve sonradan yüklenen `identity.css` ile üretiliyor.
- `site.routes.json` yalnızca BNTI, WTI ve MENA dashboard'larını ayrı SDCofA depolarından mount ediyor. Diğer ürünlere yalnızca ana CSS'i değiştirmek yeterli değil.
- Pilot sayfası 6 hafta ve USD 15.000 başlangıç fiyatı; erişim sayfası USD 36.000/yıl başlangıç fiyatı yayımlıyor. Başvuru GitHub issue formuna gidiyor.
- The Keep bağlantısı `the-keep-enterprise.ardakgul4.workers.dev/login` adresine gidiyor ve kuruluş erişim anahtarı istiyor. Kapalı işlevleri ve özel müşteri verisinin varlığı doğrulanmadı.
- Katalog 24 yayın kaydı içeriyor: 14 MCT, 10 SDCofA. Tümünde frontend kaynağı bulundu. Canlı katalogda bazı SDCofA kartlarında yalnızca yöntem bağlantısı gözlendi; güncel renderer tüm kartlarda canonical bağlantı üretiyor. Kaynak ve yayın eşleşmesi tam envanterde kontrol edilecek.
- SDCofA Election deposunun varsayılan dalı `master`; kayıtlı yöntem bağlantısındaki `main` dalı hatalı. Bu, ürünün yokluğu anlamına gelmiyor.
- Forecast evaluation protocol çağrısı aynı sayfadaki kısa bölüme dönüyor; ayrıntılı protokol bu rota üzerinde bulunmadı. Güven merkezi değerlendirme kanıtının henüz sunulmadığını açıklıyor.

## Görsel olarak incelenen örnekler

| Ekran | Gözlem |
| --- | --- |
| Ana site | Lacivert, büyük sans-serif başlıklar, platform ve sektör anlatısı |
| WTI ve MENA | Koyu zemin, serif başlıklar, endeks/harita/olay düzeni |
| EconMap | Tam ekran atlas, yoğun komut menüsü ve katman kontrolleri |
| ESGMap | Sol gezinme, harita katmanları, yıl seçimi ve gösterge lejantı |
| MacroIntel | Ağ görselleştirmesi, kaynak paneli ve ayrı kontrol düzeni |
| Cloudy&Shiny | Üç sütunlu piyasa göstergeleri, ticker ve yoğun grafik düzeni |
| PrepTürk | Türkçe yerel hazırlık çalışma alanı; çevrimdışı ve yazdırma işlevleri |

Bu tablo bir tam ürün fonksiyon denetimi değildir. Kalan yayınlar ve tüm etkileşimler uygulamanın ilk envanter aşamasında incelenecek. PrepTürk ilk gezintide kısa süreli stilsiz açıldı; yeni gezintide stylesheet ve normal sayfa genişliği doğrulandı. Kalıcı yerleşim arızası olarak sınıflandırılmadı.

## İçerik ve kaynak bağımlılıkları

`src/content/site.json` üretilen portfolio/brand projeksiyonu; `editorial.json` anlatı kaynağı. `sync-content.mjs`, haricî governance kaynağı verilirse portfolio ve claims kayıtlarını kullanıyor. Önceki sibling checkout'un bulunmadığı kaynakta açıkça belirtiliyor; committed fallback kullanılabiliyor. Asıl kayıt kaynağının varlığı ayrıca doğrulanmalı.

Ticari yaklaşım yalnızca fiyat sayfalarında değil; renderer, FAQ, JSON-LD offers, llms corpus, `static/ai.txt`, `static/agents.txt`, sözleşme/playbook belgeleri, canlı kontrol betiği ve test beklentilerinde de yer alıyor. Geçmiş kayıtlar aktif ticari tekliflerden ayrı ele alınacak.

## Yorum

Veri önceliği için ana sayfanın hiyerarşisi değişmeli. Ürünler için tek ekran şablonu yeterli değil; ortak kabuk ve veri bileşenleri, farklı atlas/panel/kılavuz düzenlerine uygulanmalı. Three.js'in varlığı görsel hedefin tamamlandığı anlamına gelmiyor; bugünkü prosedürel sahne veriyle ilişkili etkileşime dönüştürülebilir.
