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
- **Onarım Galerisi (Galeri):** Tamamen onarılan (5 dikiş alan) tüm hikayeler özel bir galeride sergilenir.

### 📜 Bilgelik Panosu (Wisdom Board) & "Bilge" Rozeti
- **Aydınlanmış Bilge Rolü:** Toplulukta yorum beğenileri (net upvote skoru) toplam kayıtlı kullanıcı sayısına ulaşan veya geçen kullanıcılar otomatik olarak **Bilge** rozeti/rolü kazanır.
- **Kendi Grubunu Yönet:** Sadece Bilge veya Admin rolündeki kullanıcılar kendi uzmanlık alanlarında gruplar (kategoriler) açabilir ve yönetebilir.
- **Zarif Tasarım:** Bilgelik paylaşımları çatlak barındırmaz; onlar zaten onarılmış, saf altın çerçeveli "bilgelik kristalleridir".

### 💬 Yorumlar, Reddit Tipi Oylama ve Sohbet (DM)
- **Reddit Tipi Dikey Oylama:** Yorumların sol tarafında dikey olarak konumlandırılmış ▲/▼ butonları ile Reddit benzeri oylama deneyimi.
- **Takip Sistemi:** Kullanıcılar birbirlerini takip edebilir ve takip ettikleri ruhların gelişimini izleyebilir.
- **Anlık Sohbet (Chat):** Takipleşen kullanıcılar arasında gerçek zamanlı (real-time), Socket.io tabanlı özel mesajlaşma altyapısı.

### 🛡️ Güvenlik ve Moderasyon
- **JWT Kimlik Doğrulama:** Tüm API istekleri JSON Web Token ile korunur. Yetkisiz veri çekme, başkasının yerine post paylaşma/silme açıkları kapatılmıştır.
- **Yerel Moderasyon Algoritması:** Dış API'lara ihtiyaç duymayan, yüksek performanslı ve Türkçe karakter uyumlu yerel küfür/argo ve duygu koruma filtresi.
- **Gelişmiş Yönetim Paneli:** Toplam istatistikler ve kullanıcı yönetimi/rol ataması için merkezi kontrol paneli.

---

## 🛠️ Teknoloji Yığını

### Frontend
- **Framework:** React 19 & Vite
- **UI & Tema:** Material UI (MUI) & Custom CSS
- **İletişim:** Socket.io-client (Gerçek zamanlı mesajlaşma ve anlık bildirimler)
- **Efektler:** Canvas Confetti, CSS Keyframe Animations

### Backend
- **Sunucu:** Node.js & Express.js
- **Veritabanı:** PostgreSQL (Supabase) - Hızlı, bulut tabanlı ve güvenli ilişkisel veritabanı.
- **Güvenlik:** JWT (JSON Web Token), bcryptjs
- **Dosya Yönetimi:** Multer

---

## 🏗️ Proje Yapısı

```bash
Gilded/
├── server/             # Node.js/Express Backend
│   ├── db.cjs          # Supabase PostgreSQL havuz bağlantısı ve admin kontrolü
│   ├── index.cjs       # Ana API sunucusu, JWT doğrulama ve yetkilendirmeler
│   ├── uploads/        # Kullanıcıların yüklediği görseller
│   └── utils/          # Moderasyon ve Türkçe küfür filtreleri
├── src/                # React Frontend
│   ├── components/     # KintsugiCard, PostForm, Navbar, Footer vb.
│   ├── context/        # Tema ve Socket/Kullanıcı state yönetimi
│   ├── pages/          # Home, WisdomBoard, MessagesPage, AdminPanel, Profile, Gallery
│   └── css/            # kintsugi.css (Altın efektleri ve global stiller)
└── index.html          # Uygulama giriş noktası
```

---

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

### 1. Veritabanını Kurun (Supabase)
1. Bir [Supabase](https://supabase.com) projesi oluşturun.
2. Projenizin panelinde **SQL Editor** kısmına gidin.
3. Geliştirme dosyalarındaki `scratch/supabase_schema.sql` veya `C:\Users\ÖMER FARUK\.gemini\antigravity\brain\f44f89fb-2758-4c03-95b6-6584d56bd0ae\scratch\supabase_schema.sql` dosyasının içeriğini kopyalayıp SQL Editor'e yapıştırın ve **Run** tuşuna basarak tabloları oluşturun.

### 2. Çevresel Değişkenleri Yapılandırın (`.env`)
Proje kök dizinindeki `.env` dosyasını açın ve Supabase bilgilerinize göre doldurun:
```env
PORT=5000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:[SENİN_SUPABASE_ŞİFREN]@db.[SENİN_PROJECT_REF].supabase.co:5432/postgres
JWT_SECRET=kendi_guvenli_anahtarin_buraya
```

### 3. Bağımlılıkları Yükleyin
Terminalde proje kök dizininde şu komutu çalıştırın:
```bash
npm install
```

### 4. Uygulamayı Başlatın
Sunucu ve istemciyi aynı anda çalıştırmak için şu komutu çalıştırın:
```bash
npm run dev
```
*Bu komut hem Express backend sunucusunu (`localhost:5000`) hem de Vite frontend geliştirme sunucusunu (`localhost:5173`) otomatik olarak başlatacaktır.*

### 5. Admin Hesabı Bilgileri
Veritabanı başarıyla bağlandığında, backend sunucusu otomatik olarak aşağıdaki yönetici hesabını oluşturacaktır:
- **E-posta:** `admin@gold.com`
- **Şifre:** `123456`

---

## 🛤️ Roadmap & Gelecek Planları
- [x] **Yerel Moderasyon:** Kendi kendine yeten küfür filtresi.
- [x] **Gelişmiş Bilge Rolü:** Kişisel grup yönetimi ve takipçi sayacı.
- [x] **Meditasyon Modu:** Arka planda çalan lo-fi sesler ve 4-4-4-4 kutu nefes egzersizi.
- [x] **Yapay Zeka Destekli Dert Analizi:** Google Gemini AI ve yerel filozof kütüphanesi ile dertlere özel kadim tavsiyeler.
- [ ] **Docker & Cloud Deployment:** Tek komutla prodüksiyon kurulumu ve konteynerleştirme.
- [ ] **PWA (Progressive Web App):** Mobil ve masaüstüne uygulama olarak yüklenebilme.
- [ ] **Mobil Native Uygulama:** React Native ile iOS & Android için tam performanslı mobil deneyim.

---

**"Kusurlarınızda bir güzellik var, tıpkı kırılmış bir vazonun altın dikişleri gibi."** 🏺✨
