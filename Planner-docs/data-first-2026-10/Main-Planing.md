# Monarch Castle: veri merkezli kimlik ve ürün bütünlüğü

2 Ekim 2026 — kullanıcının “Evet” yanıtıyla onaylanan ve GitHub üzerinden uygulanması istenen plan.

## Amaç ve yaklaşım

Monarchcastle.com, yayınlanan verilerin, haritaların, kaynakların ve analiz araçlarının keşfedildiği ana giriş olacak. Janes'in veri kataloğu ve kaynak disiplini ile Palantir'in güçlü görsel anlatımı referans alınacak. Monarch Castle'ın kendi marka kimliği geliştirilecek. Kime hizmet edildiğini anlatan sektör ve satış metinleri ikinci sıraya taşınacak.

Mevcut Three.js altyapısı geliştirilecek. Ana site, The Keep ve ürünler ortak bir tasarım sistemi kullanacak; ürünlerin veri yapıları ve işlevleri korunacak. The Keep'in fiyat, ücretli pilot ve abonelik yaklaşımı kaldırılacak; ilk hedef, mevcut kamusal verilerin ücretsiz incelendiği bir çalışma alanı olacak.

## Onaylanan temel kararlar

1. Öncelik sırası: veri, coğrafya, zaman, kaynak, yöntem, araçlar, şirket bilgisi.
2. Ana gezinme: Data / Maps / Signals / Research / Methodology; belirgin eylem: Open The Keep. Company ve iletişim alt bölümde bulunacak.
3. Ana marka paleti: koyu lacivert ve grafit; veri tablolarında açık yüzeyler; ölçülü mavi ve bronz vurgu. Ortak yazı ailesi ve ölçü sistemi.
4. Three.js, yayınlanan verileri anlamaya yarayan bir atlas sahnesi olarak geliştirilecek. Hareketin merkezi ana sayfa olacak; her ürüne zorunlu 3D uygulanmayacak.
5. The Keep kamusal kullanımda ücretsiz olacak. Ödeme, yükseltme, ücretli pilot ve sözleşmeye bağlı erişim mesajları kaldırılacak.
6. Ortak ürün kabuğu ve veri bileşenleri oluşturulacak. Mevcut ürünleri tek teknolojiye taşımak yerine kendi kaynaklarında uygulanacak.
7. Yayından kaldırılan ya da deneysel veriler açıklanacak. Yeni tasarım, eksik veriyi mevcut veya doğrulanmış gibi göstermeyecek.

## Ana sayfanın yeni yapısı

- Açılış: kısa marka ifadesi, Three.js atlası, incelenebilen gerçek veri katmanları ve yanında seçili kaydın özeti.
- Son yayımlanan veriler: her veri ailesinin kendi gözlem ve yayın zamanı; aktif, gecikmiş, durdurulmuş durumları.
- Veri kataloğu: konu, coğrafya, tarih, kaynak ve yayın durumuna göre filtreleme; ürün adından önce veri içeriği.
- Haritalar ve araştırma araçları: gerçek ürün ekranlarından seçilmiş görseller ve doğrudan giriş.
- Güncellemeler ve analizler: yalnızca mevcut kaynak kayıtları ve gerçek araştırma içerikleri.
- Kaynak ve yöntem: veri zinciri, sınırlılıklar, indirme lisansı ve makine tarafından okunabilen çıktı bağlantıları.
- Şirket, iletişim ve proje bilgileri: ikincil konumda.

Mevcut Products ve Datasets yolları katalogla ilişkilendirilecek. Eski adreslerin çalışması korunacak. Farklı endeksler ortak ölçekteymiş gibi sıralanmayacak.

## Three.js tasarımı

Kaynak deposunda `three` zaten mevcut. İlk tasarım denemesi; gerçek ülke geometrisi üzerinde yayınlanmış göstergelerin katmanlandığı, seçime tepki veren bir dünya/bölge atlası olacak. Seçilen ülke veya veri ailesi yanında kaynak, zaman ve ölçü bilgisi açılacak. Ticaret ve koridor çizgileri yalnızca kayıtlarla destekleniyorsa gösterilecek.

Kamera hareketi kısa ve kontrollü olacak. Metin ve filtreler HTML üzerinde kalacak. Veri yüklemesi ve okuma 3D sahnenin başlamasını beklemeyecek. Küçük ekranlar, azaltılmış hareket tercihi ve WebGL başarısızlığında kullanılabilir 2D/statik görünüm bulunacak. Mevcut gecikmeli yükleme, görünmez sekmede durdurma ve çözünürlük sınırlama davranışı korunacak.

## The Keep'in ücretsiz yapıya dönüşmesi

- `/pricing/` ve `/pilot/` üzerindeki ticari içerik kaldırılacak; eski adresler ücretsiz erişim bilgisine veya The Keep girişine yönlendirilecek.
- Ana sayfa, platform, şirket, kullanım senaryosu, FAQ, sayfa açıklamaları, JSON-LD ve makine tarafından okunabilen site metinleri birlikte güncellenecek.
- Ücretli kuruluş erişimi isteyen mevcut bağlantı yerine marka alan adı altında ücretsiz kamusal giriş tasarlanacak.
- İlk sürüm mevcut kamusal verilerde ortak arama, filtreleme, kaynak inceleme ve cihazda saklanan izleme listelerini hedefleyecek. Mevcut işlevler kaynak incelemesiyle doğrulanacak; ilan edilen fakat çalışmayan işlevler tamamlanmış gibi sunulmayacak.
- Kamusal erişim için ödeme veya ticari erişim anahtarı gerekmeyecek. Varsa özel kuruluş verileri, mevcut hesaplar ve yetkiler kamusallaştırılmayacak. Ödeme kapısını kaldırmak, özel veri erişimini kaldırmak anlamına gelmeyecek.
- Zamanlanmış sunucu işlemleri, özel bağlayıcılar ve kurum verilerinin geleceği mevcut The Keep kaynağı incelendikten sonra kesinleştirilecek; bu plan bunlar için sınırsız ücretsiz hizmet vaadi üretmiyor.
- Ticari teklifler aktif belgelerden de kaldırılacak; geçmiş sözleşme ve karar kayıtları ayrıca gözden geçirilip arşivlenecek, topluca silinmeyecek.

## Ürünlerin ortak tasarım sistemi

Ortak parçalar: marka üst alanı, ürün kimliği, siteye dönüş, gezinme, arama, filtreler, kaynak/zaman bilgisi, tablo ve grafik tipografisi, açıklama panelleri, boş ve hata durumları, klavye odağı ve renk anlamları.

Ürün düzenleri veri türüne göre korunacak:

| Ürün grubu | Düzen yaklaşımı |
| --- | --- |
| WTI, MENA, BNTI | Harita, endeks geçmişi, olay listesi ve yöntem |
| EconMap, ESGMap, MacroIntel | Atlas, katman seçimi, ülke kaydı ve veri tablosu |
| Piyasa, enerji, denizcilik ve tedarik göstergeleri | Zaman serileri, göstergeler ve kaynak kaydı |
| PrepTürk | Türkçe, çevrimdışı kullanım, okunabilir hazırlık kılavuzu |
| Süper Lig Forecast ve teknik demolar | Ortak marka kabuğu; kendi analitik/teknik işlevleri |
| SDCofA haber monitörleri ve diğer kaynak yayınları | Mevcut arayüzde haber akışı ve kaynak ayrıntısı; hesaplanmayan risk skorları eklenmeyecek |

Katalogdaki 24 kaydın tamamında frontend kaynağı bulundu. Her birinin yayınlanan URL'si, kaynak deposu, teknolojisi, işleyen etkileşimleri, veri çıktısı, erişim durumu ve tasarım farkları tek tek kaydedilecek. Kaynakta arayüz bulunması ile kanonik URL'de kullanılabilir arayüz bulunması ayrı doğrulanacak.

İlk kaynak matrisi `Product-Inventory.md` dosyasında hazır. Yedi ürünün canlı ekranları görsel olarak incelendi; kalan ekranlar ve bütün etkileşimler ilk uygulama aşamasında doğrulanacak.

## Uygulama sırası ve teslimatlar

1. Tam envanter: tüm ürün ve The Keep kaynaklarının kontrolü, sürüm/URL haritası, veri ve tasarım matrisi.
2. Tasarım sistemi: renkler, tipografi, bileşen durumları ve ana sayfa/atlas/panel wireframe'leri.
3. İlk çalışan önizleme: yeni ana sayfa, Three.js atlası, WTI örnek ekranı ve ücretsiz The Keep giriş/inceleme alanı.
4. Ticari içeriğin bütünlüklü kaldırılması: sayfalar, metadata, FAQ, yapılandırılmış veri, üretilen metinler ve ilgili testlerin yeni kurallara uyarlanması.
5. Ürünlere yayılım: önce WTI/MENA/BNTI, sonra EconMap/ESGMap/MacroIntel, ardından diğer kamusal ürünler ve özel işlevli araçlar.
6. Doğrulama: verilerin ve etkileşimlerin korunması, mobil/tablet/masaüstü, klavye, kaynak bağlantıları, animasyonun başarısızlık durumları ve yükleme maliyeti.

Her aşama, ekran görüntüleri ve verinin kaynağına kadar takip edilebildiği örneklerle gözden geçirilecek. Mevcut kayıtların bilimsel yöntemini veya puanlama formülünü değiştirmek bu tasarım işinin kapsamına girmiyor.

## İlk kapsam ve bağımlılıklar

Ana kaynak: `MonarchCastleTech/MonarchCastleTech.github.io`. Güncel kaynak ağacı: `5ecd67907abbe8739b6ad402e3c22826654e9d2f`. Ana depo ve 24 ürün deposu yerel olarak hazırlandı; depoya özgü yönergeler okundu.

Kesin bilinen etki alanları:

- `src/styles/site.css`, `src/styles/identity.css`
- `src/scripts/hero-loader.js`, `src/scripts/hero-scene.js`
- `scripts/build-site.mjs`, `site.routes.json`
- `src/content/editorial.json`, `src/content/site.json`, `scripts/sync-content.mjs`
- `tests/homepage-content.test.mjs`, `tests/route-contract.test.mjs`, `tests/build-site.test.mjs`, `tests/build-output.dist.test.mjs`, `tests/browser/site-smoke.spec.mjs` ve ilgili doğrulama testleri
- Aktif ticari pilot/fiyat belgeleri, `.github/ISSUE_TEMPLATE/pilot_request.yml`, `static/ai.txt`, `static/agents.txt`, üretilen JSON-LD ve llms metinleri; `scripts/check-live-site.mjs` ve `tests/workflow-config.test.mjs`
- Ayrı ürün depolarındaki ortak kimlik ve UI kaynakları; kesin dosyalar envanterde belirlenecek.

`company-governance` kaynağı şu an erişilebilir olarak doğrulanmadı. İçerik senkronizasyonu, onaylı kayıtların üretilen projeksiyonunu kullanıyor; varsa asıl kayıt kaynağı bulunarak güncellenecek, yoksa desteklenen mevcut fallback yolu dikkate alınacak. Yeniden üretimin değişiklikleri silmesi engellenecek.

## Başarı ölçütleri

- Ana sayfanın ilk ekranından veri, harita ve kaynağa doğrudan ulaşılabilmesi.
- Ticari fiyat, ücretli pilot, abonelik ve yükseltme çağrılarının kamusal siteden ve üretilen metinlerden kalkması.
- Kamuya açık The Keep görünümünün ödeme ve kuruluş erişim anahtarı olmadan açılması.
- Ürünlerin ortak marka, gezinme ve veri gösterim kurallarını kullanması.
- Veri değeri, zaman, kaynak, yöntem ve yayın durumunun birlikte okunabilmesi.
- 3D açılmadan da temel verinin okunması; klavye ve azaltılmış hareket desteği.
- Mobil/tablet/masaüstünde taşma olmaması ve mevcut filtre/harita/indirme işlemlerinin çalışması.
- Mevcut hesaplamaların ve çıktı değerlerinin tasarım değişiminden etkilenmemesi.

Doğrulama komutları ve açık konular `Sub-Planing-Audit.md` dosyasında bulunur. Durum: ana site ve 24 ürünün arayüz uygulaması tamamlandı; son doğrulama ve taslak PR teslimi yürütülüyor. Canlı yayın için birleştirme yapılmadı.

## Referanslar

- https://www.janes.com/ — veri kataloğu, kaynak doğrulama ve bağlantılı kayıt yaklaşımı.
- https://www.palantir.com/ — güçlü açılış kompozisyonu ve ürün görselleriyle anlatım.
- https://monarchcastle.com/products/ — mevcut katalog ve yöntem sınırları.
- https://github.com/MonarchCastleTech/MonarchCastleTech.github.io — güncel kaynak mimarisi; cache'lenmiş README ile canlı dosyalar farklı olabilir.
- https://threejs.org/manual/pages/rendering-on-demand.html — gerektiğinde render etme yaklaşımı.
