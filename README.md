<p align="center">
  <img src="assets/icon.png" alt="ToDoss ikonu" width="120" />
</p>

<h1 align="center">ToDoss</h1>

<p align="center">
  Görevlerini planla, hatırlatıcı kur, ilerlemeni takip et.<br />
  React Native + Expo ile yazılmış, tamamen çevrimdışı çalışan bir yapılacaklar uygulaması.
</p>

---

## Özellikler

- **Ana sayfa**: Saate göre selamlama, bugünkü ilerleme halkası, motivasyon mesajı, kategoriye göre filtreleme ve tek dokunuşla görev tamamlama.
- **Görev ekleme ve düzenleme**: Başlık, not, tarih, başlangıç ve bitiş saati, kategori, öncelik (Düşük / Orta / Yüksek) ve hatırlatıcı.
- **Takvim**: Kaydırılabilen hafta şeridi, görevi olan günlerde nokta işareti, saate göre sıralanmış zaman çizelgesi.
- **İlerleme**: Haftalık ve aylık görünüm, art arda gün serisi, tamamlanan görev sayısı ve tamamlama oranı (önceki döneme göre farkıyla), çubuk grafik, kategori bazında ilerleme.
- **Hatırlatıcılar**: Görev saatinden 5 dakika ile 1 gün arası önce yerel bildirim. Bildirime dokununca ilgili görev açılır.
- **Kategoriler**: Yeni kategori ekleme, renk seçme, yeniden adlandırma ve silme. Silinen kategorideki görevler "Kişisel"e taşınır.
- **Profil**: Ad düzenleme, istatistik özeti, bildirim ayarları, varsayılan hatırlatma süresi, tanıtımı tekrar gösterme ve tüm verileri sıfırlama.
- **Tanıtım ekranları**: İlk açılışta üç sayfalık tanıtım ve ad girme adımı.
- **Her cihaza uyumlu**: Küçük telefonlardan tabletlere kadar ölçeklenen arayüz. Erişilebilirlik etiketleri, yeterli renk kontrastı ve sistemin "hareketi azalt" ayarına uyan animasyonlar.

Hesap ya da sunucu yoktur; tüm veriler cihazda bir SQLite veritabanında saklanır.

## Teknolojiler

| Alan | Kullanılan |
| --- | --- |
| Çatı | [Expo](https://expo.dev) SDK 58, React Native 0.88, React 19 |
| Dil | TypeScript (strict) |
| Navigasyon | Expo Router (dosya tabanlı, typed routes) |
| Veritabanı | expo-sqlite |
| Bildirimler | expo-notifications |
| Tarih/saat seçici | @react-native-community/datetimepicker |
| İkonlar ve grafik | @expo/vector-icons (Feather), react-native-svg |
| Yazı tipi | Plus Jakarta Sans |

## Kurulum

### Gereksinimler

- [Node.js](https://nodejs.org) (LTS sürüm)
- Android için [Android Studio](https://developer.android.com/studio) ve Android SDK, iOS için macOS ve Xcode
- Ya da yerel kurulum yapmadan bulutta derlemek için bir [EAS](https://expo.dev/eas) hesabı

### Adımlar

```bash
git clone https://github.com/HamzaShn/todoss.git
cd todoss
npm install
```

> **Not:** Uygulama bildirimler ve tarih seçici gibi yerel (native) modüller kullandığı için **Expo Go'da tam çalışmaz**. Bir *development build* ile çalıştırılmalıdır.

### Android'de çalıştırma

Telefonu USB ile bağla (geliştirici seçenekleri ve USB hata ayıklama açık olmalı) ya da bir emülatör başlat, sonra:

```bash
npm run android
```

Bu komut `android/` klasörünü oluşturur, uygulamayı derleyip cihaza yükler ve geliştirme sunucusunu başlatır. Sonraki açılışlarda sadece sunucuyu başlatman yeterli:

```bash
npm start
```

### iOS'ta çalıştırma (macOS)

```bash
npm run ios
```

### EAS ile bulutta derleme

```bash
npx eas-cli@latest build --profile preview --platform android
```

| Profil | Çıktı | Kullanım |
| --- | --- | --- |
| `development` | APK | Geliştirme sunucusuna bağlanan test sürümü |
| `preview` | APK | Telefona doğrudan kurulabilen test sürümü |
| `production` | AAB | Google Play'e yüklenecek sürüm |

## Komutlar

| Komut | Açıklama |
| --- | --- |
| `npm start` | Geliştirme sunucusunu başlatır |
| `npm run android` | Android'de derleyip çalıştırır |
| `npm run ios` | iOS'ta derleyip çalıştırır |
| `npm run lint` | ESLint ile kodu denetler |
| `npm run typecheck` | TypeScript tip kontrolü yapar |

## Proje yapısı

```
src/
├── app/              # Ekranlar (Expo Router)
│   ├── (tabs)/       # Ana sayfa, Takvim, İlerleme, Profil
│   ├── task/         # Yeni görev ve görev düzenleme
│   ├── onboarding.tsx
│   ├── notifications.tsx
│   └── categories.tsx
├── components/       # Ekran bileşenleri ve ui/ altında temel bileşenler
├── db/               # SQLite şeması, migration'lar ve sorgular
├── hooks/            # Veri ve arayüz hook'ları
├── notifications/    # Hatırlatıcı planlama
├── theme/            # Renkler, tipografi, boşluklar
├── types/            # Ortak TypeScript tipleri
└── utils/            # Tarih, istatistik ve yardımcı fonksiyonlar
assets/               # Uygulama ikonu, splash ve bildirim ikonu
```

Uygulamanın ayrıntılı tasarım ve geliştirme dokümanı [TODOSS.md](TODOSS.md) dosyasındadır.

## Sorun giderme

**Windows'ta Android derlemesi `ninja` / `mkdir` hatasıyla duruyor.**
Bazı yollar Windows'un 260 karakter sınırını aşıyor. Android SDK Manager'dan yeni bir CMake sürümü (ör. 4.x) kur ve `android/local.properties` dosyasına ekle:

```properties
cmake.dir=C:/Users/<kullanıcı>/AppData/Local/Android/Sdk/cmake/4.1.2
```

Ardından `android/app/.cxx` klasörünü silip tekrar derle.

**Bildirim gelmiyor.**
Profil ekranından bildirimlerin açık olduğunu kontrol et. Android'de "Tam zamanında hatırlat" uyarısı görünüyorsa, dokunup alarm iznini ver.

## Lisans

Bu proje [MIT lisansı](LICENSE) ile lisanslanmıştır.
