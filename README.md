# 🏺 Gilded (Kintsugi Space)

**"Yaralarınız, ışığın içeri girdiği yerdir. Kırıldığımız yerlerden daha güçlüyüz."** ✨

Gilded, insanların hayatlarındaki "kırık parçaları" (zorluklar, başarısızlıklar, üzüntüler) paylaştığı ve topluluğun bu parçaları Japon **Kintsugi** sanatı felsefesiyle "altın dikişler" atarak onardığı premium bir sosyal platformdur. Kintsugi, kırılan objeleri altınla onararak onları eskiden olduğundan daha değerli ve estetik kılan kadim bir Japon felsefesidir.

---

## 🎨 Tasarım Felsefesi & Estetik
Gilded, sıradan bir sosyal medya uygulamasından ziyade, huzur veren dijital bir sığınak olarak tasarlanmıştır.
- **Likit Altın (Liquid Gold) Görselleri:** Paylaşımlar (kartlar) destek aldıkça üzerindeki çatlaklar dinamik olarak altınla dolar. 5. seviyeye ulaşan kartlar tamamen onarılır, parlar ve altın bir çerçeve kazanır.
- **Premium Karanlık Mod:** Derin siyahlar (#050505) ve fırçalanmış altın tonları (#D4AF37) ile yüksek kontrastlı, göz yormayan lüks bir tasarım.
- **Mikro-Animasyonlar:** Zarif geçişler, altın parıltıları ve dikiş efektleriyle yaşayan bir arayüz.

---

## ✨ Temel Özellikler

### 🧘‍♂️ Kintsugi Onarım Döngüsü
- **Altın Dikiş (Stitch):** Klasik "beğen" yerine, kullanıcılar birbirlerinin acılarına "Altın Dikiş" atarak destek olur.
- **Dinamik Gelişim:** Her dikiş, kartın kenarlığının kalınlaşmasını ve parlaklığının artmasını sağlar.
- **Onarım Galerisi (Hall of Fame):** Tamamen onarılan (5 dikiş alan) tüm hikayeler özel bir galeride sergilenir.

### 📜 Bilgelik Panosu (Wisdom Board)
Bilgeler tarafından yönetilen, "gürültüden uzak" bir rehberlik alanı.
- **Bilge (Sage) Rolü:** Topluluğa rehberlik eden özel yetkili kullanıcılar.
- **Kendi Grubunu Yönet:** Bilgeler kendi uzmanlık alanlarında gruplar (kategoriler) açabilir ve bu grupların takipçi sayılarını görebilir.
- **Gizlilik ve Odak:** Bilgelik paylaşımları sadece o grubu takip eden kullanıcılara görünür, genel akışı meşgul etmez.
- **Zarif Tasarım:** Bilgelik paylaşımları çatlak barındırmaz; onlar zaten onarılmış, saf altın çerçeveli "bilgelik kristalleridir".

### 🛡️ Güvenlik ve Moderasyon
- **Yerel Moderasyon Algoritması:** Dış API'lara (Gemini vb.) ihtiyaç duymayan, yüksek performanslı ve gizlilik odaklı yerel küfür/argo filtresi.
- **Tam Anonimlik:** Kullanıcılar kendilerini en rahat şekilde ifade edebilsin diye paylaşımlar varsayılan olarak anonimdir.
- **Gelişmiş Admin Paneli:** Tüm kategorilerin, kullanıcıların ve içeriklerin merkezi kontrolü.

---

## 🛠️ Teknoloji Yığını

### Frontend
- **Framework:** React 18 & Vite
- **UI & Tema:** Material UI (MUI) & Custom Vanilla CSS
- **State & Router:** React Router 7, Context API
- **Efektler:** Canvas Confetti, CSS Keyframe Animations

### Backend
- **Sunucu:** Node.js & Express.js
- **Veritabanı:** SQLite (`better-sqlite3`) - Taşınabilir, hızlı ve ilişkisel.
- **Gerçek Zamanlı İletişim:** Socket.io (Bildirimler ve anlık etkileşimler için hazır yapı).
- **Dosya Yönetimi:** Multer (Görsel yükleme).

---

## 🏗️ Proje Yapısı

```bash
Gilded/
├── server/             # Node.js/Express Backend
│   ├── db.cjs          # Veritabanı şeması ve SQLite bağlantısı
│   ├── index.cjs       # Ana API sunucusu ve yetkilendirme logicleri
│   ├── uploads/        # Kullanıcıların yüklediği görseller
│   └── utils/          # aiModeration.cjs (Yerel küfür filtresi)
├── src/                # React Frontend
│   ├── components/     # KintsugiCard, PostForm, Navbar, Footer vb.
│   ├── context/        # Tema ve Kullanıcı state yönetimi
│   ├── pages/          # Home, WisdomBoard, AdminPanel, Profile, Gallery
│   └── css/            # kintsugi.css (Altın efektleri ve global stiller)
└── index.html          # Uygulama giriş noktası
```

---

## 🔌 API Endpoints (Gelişmiş)

### Paylaşımlar (Posts)
- `GET /api/posts`: "Sıcaklık" algoritmasına göre sıralanmış normal paylaşımları getirir.
- `GET /api/posts?postType=wisdom`: Sadece takip edilen kategorilerdeki bilgelik paylaşımlarını getirir.
- `POST /api/posts`: Yeni parça paylaş (Görsel ve kategori desteği).

### Bilgelik (Wisdom)
- `GET /api/wisdom/categories`: Kategorileri, takipçi sayılarını ve sahiplik durumunu getirir.
- `POST /api/wisdom/categories`: Bilgelerin kendi grubunu açmasını sağlar.
- `POST /api/wisdom/follow`: Kategorileri takip etme/bırakma.

### Admin
- `GET /api/admin/stats`: Toplam onarım ve etkileşim sayıları.
- `DELETE /api/wisdom/categories/:id`: Merkezi kategori yönetimi.

---

## 🚀 Kurulum ve Çalıştırma

1. **Bağımlılıkları Yükle:**
   ```bash
   npm install
   ```

2. **Geliştirme Modunda Başlat:**
   ```bash
   # Hem frontend hem backend'i eşzamanlı çalıştırır
   npm run dev
   ```

3. **Admin Bilgileri:**
   - **E-posta:** `admin@gold.com` (Veya veritabanındaki admin hesabı)
   - **Şifre:** `123456`

---

## 🛤️ Roadmap & Gelecek Planları
- [x] **Yerel Moderasyon:** Kendi kendine yeten küfür filtresi.
- [x] **Gelişmiş Bilge Rolü:** Kişisel grup yönetimi ve takipçi sayacı.
- [ ] **Meditasyon Modu:** Arka planda çalan lo-fi sesler ve nefes egzersizleri.
- [ ] **Yapay Zeka Destekli Dert Analizi:** Paylaşılan dertlere uygun kadim filozoflardan alıntılar öneren bot.
- [ ] **Mobil Native Uygulama:** React Native ile tam performanslı mobil deneyim.

---

**"Kusurlarınızda bir güzellik var, tıpkı kırılmış bir vazonun altın dikişleri gibi."** 🏺✨
