const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const db = require('./db.cjs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { containsProfanity, moderateText } = require('./utils/kintsugiModeration.cjs');
const { analyzeComment } = require('./utils/aiModeration.cjs');
const { generatePhilosopherWisdom } = require('./utils/philosopherBot.cjs');

// JWT Secret Güvenlik Kontrolü
if (!process.env.JWT_SECRET) {
  console.error('❌ HATA: JWT_SECRET ortam değişkeni tanımlanmamış. Güvenlik nedeniyle sunucu başlatılamıyor.');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

// Multer Upload Klasör Kontrolü
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/x-m4a'
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp',
  '.mp3', '.wav', '.webm', '.ogg', '.m4a'
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.bin';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${safeExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Yalnızca güvenli görsel (JPEG, PNG, WEBP) veya ses (MP3, WAV, WEBM, OGG, M4A) formatına izin verilir.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Yapılandırması
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) 
  : ['http://localhost:5173', 'http://localhost:5000'];

const corsOptions = {
  origin: (origin, callback) => {
    // 1. İstek aynı sunucudan (same-origin), postman/curl veya script taginden geliyorsa (origin yoksa)
    if (!origin) return callback(null, true);
    
    // 2. Production ortamında dinamik izin (Render domainleri veya tanımlı originler)
    if (
      allowedOrigins.includes(origin) ||
      origin.includes('onrender.com') ||
      origin.includes('localhost') ||
      !process.env.CORS_ORIGIN
    ) {
      return callback(null, true);
    }
    
    // 3. İzin verilmeyen dış kaynaklara 500 fırlatmak yerine güvenle CORS başlığı basma
    callback(null, false);
  },
  credentials: true
};

// HTTP Header Güvenliği (Helmet)
app.use(helmet({
  contentSecurityPolicy: false, // Vite SPA derlemesi kendi kaynaklarını yönetir
  crossOriginResourcePolicy: { policy: "cross-origin" },
  xContentTypeOptions: true, // nosniff
  hsts: { maxAge: 31536000, includeSubDomains: true }, // HSTS
  frameguard: { action: 'deny' }, // Clickjacking engeli
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// 🛡️ Hassas Dosya ve Dizin Koruması (.env, .sqlite, .git, .sh engeli)
app.use((req, res, next) => {
  const blockedPattern = /\.(env|sqlite|sql|git|sh|bat|cmd|exe|php|config)(\/|$|\?)/i;
  if (blockedPattern.test(req.path)) {
    return res.status(403).json({ error: 'Erişim reddedildi: Bu dosya formatına web üzerinden erişim yasaktır.' });
  }
  next();
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Rate Limiting (Brute-Force & DoS Koruması)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek gönderildi, lütfen biraz sonra tekrar deneyin.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla giriş/kayıt denemesi yapıldı, lütfen 15 dakika sonra tekrar deneyin.' }
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Yapay zeka analiz sınırına ulaştınız. Lütfen biraz sonra tekrar deneyin.' }
});

const createPostLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla gönderi paylaştınız. Lütfen biraz bekleyin.' }
});

const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla yorum/destek gönderildi. Lütfen biraz bekleyin.' }
});

const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Mesajlaşma sınırına ulaştınız. Lütfen biraz sonra tekrar deneyin.' }
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/posts/:id/philosopher-wisdom', aiLimiter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.includes('onrender.com') || origin.includes('localhost') || !process.env.CORS_ORIGIN) {
        return callback(null, true);
      }
      callback(null, false);
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

const ALLOWED_CIRCLES = new Set(['night_talk', 'meditation', 'stoic_wisdom']);

// Socket.io JWT Kimlik Doğrulama Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) {
    return next(new Error('Authentication error: Token is required'));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.user = decoded; // id, email, role içerir
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  const userEmail = socket.user.email;

  // Kullanıcıyı kendi e-posta adresine ait odaya otomatik olarak al (Güvenli)
  socket.join(userEmail);

  socket.on('join', () => {
    socket.join(userEmail);
  });

// Topluluk Çemberleri (Live Circles) Socket Etkinlikleri
  socket.on('join_circle', async (circleId) => {
    if (!circleId) return;
    const roomName = circleId.startsWith('circle_') ? circleId : `circle_${circleId}`;
    socket.join(roomName);

    const activeCount = io.sockets.adapter.rooms.get(roomName)?.size || 1;
    io.to(roomName).emit('circle_presence_update', {
      circleId,
      count: activeCount
    });
  });

  socket.on('leave_circle', (circleId) => {
    if (!circleId) return;
    const roomName = circleId.startsWith('circle_') ? circleId : `circle_${circleId}`;
    socket.leave(roomName);

    const activeCount = io.sockets.adapter.rooms.get(roomName)?.size || 0;
    io.to(roomName).emit('circle_presence_update', {
      circleId,
      count: activeCount
    });
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room.startsWith('circle_')) {
        const remainingCount = Math.max(0, (io.sockets.adapter.rooms.get(room)?.size || 1) - 1);
        io.to(room).emit('circle_presence_update', {
          circleId: room.replace('circle_', ''),
          count: remainingCount
        });
      }
    }
  });

  socket.on('send_circle_message', async ({ circleId, text }) => {
    if (!circleId || !text || typeof text !== 'string') return;
    const cleanText = text.trim();
    if (!cleanText || cleanText.length > 1000) return;

    // İçerik Moderasyon Kontrolü
    const modResult = await moderateText(cleanText);
    if (!modResult.isClean) {
      socket.emit('circle_message_error', {
        error: modResult.reason || 'Mesajınız topluluk kurallarına uygun bulunmadı.'
      });
      return;
    }

    const verifiedUserName = socket.user.ad || userEmail.split('@')[0];

    const msgData = {
      id: Date.now() + Math.random(),
      sender_email: userEmail,
      sender_name: verifiedUserName,
      text: cleanText,
      created_at: new Date().toISOString()
    };
    
    const roomName = circleId.startsWith('circle_') ? circleId : `circle_${circleId}`;
    io.to(roomName).emit('new_circle_message', msgData);
  });

  socket.on('disconnect', () => {
    // Odalardan çıkış Socket.io tarafından yönetilir
  });
});

// --- AUTH MIDDLEWARES ---

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkilendirme başlığı eksik veya geçersiz' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains id, email, role
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Oturum geçersiz veya süresi dolmuş' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && String(req.user.role).toUpperCase() === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gerekiyor.' });
  }
};

// --- API ENDPOINTS ---

// Tüm postları getir
app.get('/api/posts', async (req, res) => {
  const userId = req.query.userId;
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

  try {
    const postType = req.query.postType === 'wisdom' ? 'wisdom' : 'normal';
    let postsResult;
    const isRepairedFilter = req.query.repaired === 'true' ? 'AND p.is_repaired = TRUE' : '';

    if (userId) {
      if (postType === 'wisdom') {
        const categoryId = req.query.categoryId ? parseInt(req.query.categoryId, 10) : null;
        if (categoryId && !isNaN(categoryId)) {
          const query = `
            SELECT p.*, u.ad as author_name, u.role as author_role, c.name as category_name,
            (SELECT COUNT(*)::int FROM supports s WHERE s.post_id = p.id AND s.user_id = $1) as has_supported
            FROM posts p 
            LEFT JOIN users u ON p.author_id = u.email
            LEFT JOIN wisdom_categories c ON p.category_id = c.id
            WHERE p.post_type = $2
            ${isRepairedFilter}
            AND p.category_id = $3
            AND EXISTS (SELECT 1 FROM follows f WHERE f.category_id = p.category_id AND f.user_id = $4)
            ORDER BY p.hot_score DESC, p.created_at DESC
            LIMIT $5 OFFSET $6
          `;
          postsResult = await db.query(query, [userId, postType, categoryId, userId, limit, offset]);
        } else {
          const query = `
            SELECT p.*, u.ad as author_name, u.role as author_role, c.name as category_name,
            (SELECT COUNT(*)::int FROM supports s WHERE s.post_id = p.id AND s.user_id = $1) as has_supported
            FROM posts p 
            LEFT JOIN users u ON p.author_id = u.email
            LEFT JOIN wisdom_categories c ON p.category_id = c.id
            WHERE p.post_type = $2
            ${isRepairedFilter}
            AND EXISTS (SELECT 1 FROM follows f WHERE f.category_id = p.category_id AND f.user_id = $3)
            ORDER BY p.hot_score DESC, p.created_at DESC
            LIMIT $4 OFFSET $5
          `;
          postsResult = await db.query(query, [userId, postType, userId, limit, offset]);
        }
      } else {
        const query = `
          SELECT p.*, u.ad as author_name, u.role as author_role, c.name as category_name,
          (SELECT COUNT(*)::int FROM supports s WHERE s.post_id = p.id AND s.user_id = $1) as has_supported
          FROM posts p 
          LEFT JOIN users u ON p.author_id = u.email
          LEFT JOIN wisdom_categories c ON p.category_id = c.id
          WHERE p.post_type = $2
          ${isRepairedFilter}
          ORDER BY p.hot_score DESC, p.created_at DESC
          LIMIT $3 OFFSET $4
        `;
        postsResult = await db.query(query, [userId, postType, limit, offset]);
      }
    } else {
      // Misafirler sadece normal postları görsün, bilgelik gizli
      if (postType === 'wisdom') {
        postsResult = { rows: [] };
      } else {
        const query = `
          SELECT p.*, u.ad as author_name, u.role as author_role, c.name as category_name,
          0 as has_supported
          FROM posts p 
          LEFT JOIN users u ON p.author_id = u.email 
          LEFT JOIN wisdom_categories c ON p.category_id = c.id
          WHERE p.post_type = 'normal'
          ${isRepairedFilter}
          ORDER BY p.hot_score DESC, p.created_at DESC
          LIMIT $1 OFFSET $2
        `;
        postsResult = await db.query(query, [limit, offset]);
      }
    }
    
    res.json(postsResult.rows);
  } catch (error) {
    console.error('Gönderiler getirilirken hata:', error);
    res.status(500).json({ error: 'Gönderiler yüklenirken bir hata oluştu.' });
  }
});

// Kullanıcının kendi postlarını getir
app.get('/api/users/:email/posts', async (req, res) => {
  const { email } = req.params;
  try {
    const result = await db.query(`
      SELECT p.*, u.ad as author_name, u.role as author_role 
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.email 
      WHERE p.author_id = $1 
      ORDER BY p.created_at DESC
    `, [email]);
    res.json(result.rows);
  } catch (error) {
    console.error('Kullanıcı gönderileri getirme hatası:', error);
    res.status(500).json({ error: 'Kullanıcı gönderileri alınamadı.' });
  }
});

// Kullanıcı istatistiklerini getir
app.get('/api/users/:email/stats', async (req, res) => {
  const { email } = req.params;
  try {
    const totalReceived = await db.query('SELECT SUM(support_count)::int as total FROM posts WHERE author_id = $1', [email]);
    const totalGiven = await db.query('SELECT COUNT(*)::int as total FROM supports WHERE user_id = $1', [email]);
    res.json({
      received: totalReceived.rows[0]?.total || 0,
      given: totalGiven.rows[0]?.total || 0
    });
  } catch (error) {
    console.error('Kullanıcı istatistik hatası:', error);
    res.status(500).json({ error: 'İstatistikler alınamadı.' });
  }
});

// Tekil post getir
app.get('/api/posts/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz gönderi kimliği.' });
  const userId = req.query.userId;
  
  try {
    let result;
    if (userId) {
      const query = `
        SELECT p.*, u.ad as author_name, u.role as author_role,
        (SELECT COUNT(*)::int FROM supports s WHERE s.post_id = p.id AND s.user_id = $1) as has_supported
        FROM posts p 
        LEFT JOIN users u ON p.author_id = u.email 
        WHERE p.id = $2
      `;
      result = await db.query(query, [userId, id]);
    } else {
      const query = `
        SELECT p.*, u.ad as author_name, u.role as author_role
        FROM posts p 
        LEFT JOIN users u ON p.author_id = u.email 
        WHERE p.id = $1
      `;
      result = await db.query(query, [id]);
    }
    const post = result.rows[0];
    if (!post) return res.status(404).json({ error: 'Post bulunamadı' });
    res.json(post);
  } catch (error) {
    console.error('Gönderi detay hatası:', error);
    res.status(500).json({ error: 'Gönderi detayları yüklenemedi.' });
  }
});

// Post için felsefi tavsiye / kadim bilgelik üret
app.post('/api/posts/:id/philosopher-wisdom', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz gönderi kimliği.' });

  try {
    const postRes = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
    const post = postRes.rows[0];
    if (!post) return res.status(404).json({ error: 'Post bulunamadı' });

    const wisdom = await generatePhilosopherWisdom(post.content, post.mood);
    res.json(wisdom);
  } catch (error) {
    console.error('Felsefi bilgelik üretme hatası:', error);
    res.status(500).json({ error: 'Felsefi tavsiye oluşturulurken bir hata oluştu.' });
  }
});

// Bir postun yorumlarını getir
app.get('/api/posts/:id/comments', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz gönderi kimliği.' });
  const userId = req.query.userId || null;

  try {
    const query = `
      SELECT c.*, u.ad as author_name,
      (SELECT vote_type FROM comment_votes v WHERE v.comment_id = c.id AND v.user_id = $2) as user_vote
      FROM comments c 
      LEFT JOIN users u ON c.author_id = u.email 
      WHERE c.post_id = $1 
      ORDER BY c.created_at ASC
    `;
    const result = await db.query(query, [id, userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Yorumları getirme hatası:', error);
    res.status(500).json({ error: 'Yorumlar yüklenemedi.' });
  }
});

// Yeni post ekle (Multer hata yakalama mekanizmalı sarmalayıcı ve Rate Limit ile)
const uploadSingleImage = upload.single('image');
app.post('/api/posts', requireAuth, createPostLimiter, (req, res, next) => {
  uploadSingleImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Görsel boyutu çok büyük. Maksimum limit 10MB\'dır.' });
      }
      return res.status(400).json({ error: `Görsel yükleme hatası: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  const { content, post_type = 'normal', category_id = null, is_anonymous = 1, mood = null } = req.body;
  const author_id = req.user.email; // JWT'den alınan kimlik

  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'İçerik gerekli' });
  }

  const cleanContent = content.trim();
  if (cleanContent.length > 5000) {
    return res.status(400).json({ error: 'Gönderi içeriği en fazla 5000 karakter olabilir.' });
  }

  const isAudio = req.file && (req.file.mimetype.startsWith('audio/') || ['.mp3', '.wav', '.webm', '.m4a', '.ogg'].includes(path.extname(req.file.filename).toLowerCase()));
  const image_url = req.file && !isAudio ? `/uploads/${req.file.filename}` : null;
  const audio_url = req.file && isAudio ? `/uploads/${req.file.filename}` : null;

  const modCheck = await moderateText(cleanContent);
  if (!modCheck.isClean) {
    return res.status(400).json({ 
      error: modCheck.reason || 'Topluluk kurallarına aykırı ifade tespit edildi.',
      category: modCheck.category
    });
  }

  try {
    // Yetki Kontrolü
    const userRes = await db.query('SELECT role FROM users WHERE email = $1', [author_id]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const userRole = String(user.role || '').toUpperCase();

    if (post_type === 'wisdom' && userRole !== 'ADMIN' && userRole !== 'BILGE') {
      return res.status(403).json({ error: 'Bilgelik sözü paylaşma yetkiniz yok.' });
    }

    const safeCatId = category_id ? parseInt(category_id, 10) : null;

    // Bilge ise sadece kendisinin açtığı kategorilere atabilir
    if (post_type === 'wisdom' && userRole === 'BILGE' && safeCatId) {
      const catRes = await db.query('SELECT created_by FROM wisdom_categories WHERE id = $1', [safeCatId]);
      const category = catRes.rows[0];
      if (!category || category.created_by !== author_id) {
        return res.status(403).json({ error: 'Sadece kendi oluşturduğunuz kategorilerde paylaşım yapabilirsiniz.' });
      }
    }

    const isAnonBool = (is_anonymous === '1' || is_anonymous === 1 || is_anonymous === 'true' || is_anonymous === true);
    const safeMood = typeof mood === 'string' ? mood.slice(0, 50) : null;
    const safePostType = post_type === 'wisdom' ? 'wisdom' : 'normal';

    const insertQuery = `
      INSERT INTO posts (content, author_id, image_url, audio_url, post_type, is_anonymous, category_id, mood) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `;
    const insertRes = await db.query(insertQuery, [cleanContent, author_id, image_url, audio_url, safePostType, isAnonBool, safeCatId, safeMood]);
    res.status(201).json(insertRes.rows[0]);
  } catch (error) {
    console.error('Gönderi oluşturma hatası:', error);
    res.status(500).json({ error: 'Gönderi oluşturulurken bir hata meydana geldi.' });
  }
});

// Dikiş At (Destekle) - Her kullanıcı bir kez atabilir
app.post('/api/posts/:id/support', requireAuth, commentLimiter, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz gönderi kimliği.' });
  const user_id = req.user.email; // JWT'den alınan kimlik

  try {
    // Önce dikiş atmış mı kontrol et
    const existing = await db.query('SELECT * FROM supports WHERE post_id = $1 AND user_id = $2', [id, user_id]);
    if (existing.rows[0]) return res.status(400).json({ error: 'Zaten dikiş attınız' });

    // Dikişi kaydet
    await db.query('INSERT INTO supports (post_id, user_id) VALUES ($1, $2)', [id, user_id]);

    // Postun destek sayısını artır
    const postRes = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
    const post = postRes.rows[0];
    if (!post) return res.status(404).json({ error: 'Post bulunamadı' });

    const newSupportCount = post.support_count + 1;
    const isRepaired = newSupportCount >= 5;

    // Reddit benzeri Sıcaklık (Hot Score) hesapla ve veritabanını güncelle
    const hours = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
    const hotScore = (newSupportCount + 1) / Math.pow(hours + 2, 1.5);

    await db.query(
      'UPDATE posts SET support_count = $1, is_repaired = $2, hot_score = $3 WHERE id = $4',
      [newSupportCount, isRepaired, hotScore, id]
    );

    const updatedPostRes = await db.query('SELECT p.*, 1 as has_supported FROM posts p WHERE id = $1', [id]);

    // Bildirim oluştur (Eğer post sahibi kendi postuna destek atmadıysa)
    if (post.author_id !== user_id) {
      await db.query('INSERT INTO notifications (user_id, type, post_id) VALUES ($1, $2, $3)', [post.author_id, 'support', id]);
      
      // Real-time bildirim gönder
      io.to(post.author_id).emit('new_notification', {
        type: 'support',
        post_id: id,
        message: 'Birisi yaranı altınla dikti...',
        timestamp: new Date()
      });
    }

    res.json(updatedPostRes.rows[0]);
  } catch (error) {
    console.error('Destek atma hatası:', error);
    res.status(500).json({ error: 'Destek işlemi gerçekleştirilemedi.' });
  }
});

// Yorum At
app.post('/api/posts/:id/comments', requireAuth, commentLimiter, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz gönderi kimliği.' });

  const { content } = req.body;
  const author_id = req.user.email; // JWT'den alınan kimlik
  
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Mesaj içeriği gerekli' });
  }

  const cleanContent = content.trim();
  if (cleanContent.length > 1500) {
    return res.status(400).json({ error: 'Yorum en fazla 1500 karakter olabilir.' });
  }
  
  const modCheck = await moderateText(cleanContent);
  if (!modCheck.isClean) {
    return res.status(400).json({ 
      error: modCheck.reason || 'Bu mesaj topluluk ruhuna (destekleyici ve iyileştirici olma) uygun bulunmadı. Lütfen daha nazik ve destekleyici bir dil kullanmayı dene.',
      category: modCheck.category
    });
  }

  try {
    const parentId = req.body.parent_id ? parseInt(req.body.parent_id, 10) : null;

    await db.query(
      'INSERT INTO comments (post_id, content, author_id, parent_id, is_anonymous) VALUES ($1, $2, $3, $4, $5)',
      [id, cleanContent, author_id, parentId && !isNaN(parentId) ? parentId : null, true]
    );
    
    // Bildirim oluştur
    const postRes = await db.query('SELECT author_id FROM posts WHERE id = $1', [id]);
    const post = postRes.rows[0];

    if (parentId && !isNaN(parentId)) {
      const parentCommentRes = await db.query('SELECT author_id FROM comments WHERE id = $1', [parentId]);
      const parentComment = parentCommentRes.rows[0];
      if (parentComment && parentComment.author_id !== author_id) {
        await db.query('INSERT INTO notifications (user_id, type, post_id) VALUES ($1, $2, $3)', [parentComment.author_id, 'comment_reply', id]);
        
        io.to(parentComment.author_id).emit('new_notification', {
          type: 'comment_reply',
          post_id: id,
          message: 'Birisi destek mesajına yanıt verdi...',
          timestamp: new Date()
        });
      }
    } else if (post && post.author_id !== author_id) {
      await db.query('INSERT INTO notifications (user_id, type, post_id) VALUES ($1, $2, $3)', [post.author_id, 'post_comment', id]);
      
      io.to(post.author_id).emit('new_notification', {
        type: 'post_comment',
        post_id: id,
        message: 'Yaran için yeni bir destek mesajı var...',
        timestamp: new Date()
      });
    }
    
    // Güncel ve isimli listeyi çek
    const allCommentsRes = await db.query(`
      SELECT c.*, u.ad as author_name,
      (SELECT vote_type FROM comment_votes v WHERE v.comment_id = c.id AND v.user_id = $2) as user_vote
      FROM comments c 
      LEFT JOIN users u ON c.author_id = u.email 
      WHERE c.post_id = $1 
      ORDER BY c.created_at ASC
    `, [id, author_id]);
    
    res.json(allCommentsRes.rows);
  } catch (error) {
    console.error('Yorum ekleme hatası:', error);
    res.status(500).json({ error: 'Yorum kaydedilemedi.' });
  }
});

// Altın Yaprak Ver (Teşekkür)
app.post('/api/comments/:id/gold-leaf', requireAuth, commentLimiter, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz yorum kimliği.' });

  try {
    await db.query('UPDATE comments SET gold_leaves = gold_leaves + 1 WHERE id = $1', [id]);
    const commentRes = await db.query('SELECT * FROM comments WHERE id = $1', [id]);
    if (!commentRes.rows[0]) return res.status(404).json({ error: 'Yorum bulunamadı.' });
    res.json(commentRes.rows[0]);
  } catch (error) {
    console.error('Altın yaprak hatası:', error);
    res.status(500).json({ error: 'İşlem gerçekleştirilemedi.' });
  }
});

// Post Sil
app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz gönderi kimliği.' });

  try {
    const postRes = await db.query('SELECT author_id FROM posts WHERE id = $1', [id]);
    const post = postRes.rows[0];
    if (!post) return res.status(404).json({ error: 'Post bulunamadı' });

    const userRole = String(req.user.role || '').toUpperCase();
    if (post.author_id !== req.user.email && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Bu postu silme yetkiniz yok.' });
    }

    await db.query('DELETE FROM posts WHERE id = $1', [id]);
    res.json({ message: 'Post silindi' });
  } catch (error) {
    console.error('Post silme hatası:', error);
    res.status(500).json({ error: 'Gönderi silinemedi.' });
  }
});

// Yorum Sil
app.delete('/api/comments/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz yorum kimliği.' });

  try {
    const commentRes = await db.query(`
      SELECT c.author_id, p.author_id as post_author_id 
      FROM comments c 
      JOIN posts p ON c.post_id = p.id 
      WHERE c.id = $1
    `, [id]);
    const comment = commentRes.rows[0];
    if (!comment) return res.status(404).json({ error: 'Yorum bulunamadı' });

    const userRole = String(req.user.role || '').toUpperCase();
    if (comment.author_id !== req.user.email && comment.post_author_id !== req.user.email && userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Bu yorumu silme yetkiniz yok.' });
    }

    await db.query('DELETE FROM comments WHERE id = $1', [id]);
    res.json({ message: 'Yorum silindi' });
  } catch (error) {
    console.error('Yorum silme hatası:', error);
    res.status(500).json({ error: 'Yorum silinemedi.' });
  }
});

// Yorum Puanla (Vote)
app.post('/api/comments/:id/vote', requireAuth, commentLimiter, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz yorum kimliği.' });

  const { type } = req.body; // 'up' veya 'down'
  const userId = req.user.email;

  if (type !== 'up' && type !== 'down') {
    return res.status(400).json({ error: 'Geçersiz oy tipi.' });
  }

  try {
    const existingRes = await db.query('SELECT * FROM comment_votes WHERE comment_id = $1 AND user_id = $2', [id, userId]);
    const existing = existingRes.rows[0];

    let scoreChange = 0;

    if (existing) {
      if (existing.vote_type === type) {
        // Geri çekme
        await db.query('DELETE FROM comment_votes WHERE comment_id = $1 AND user_id = $2', [id, userId]);
        scoreChange = type === 'up' ? -1 : 1;
      } else {
        // Yön değiştirme
        await db.query('UPDATE comment_votes SET vote_type = $1 WHERE comment_id = $2 AND user_id = $3', [type, id, userId]);
        scoreChange = type === 'up' ? 2 : -2;
      }
    } else {
      // Yeni oy
      await db.query('INSERT INTO comment_votes (comment_id, user_id, vote_type) VALUES ($1, $2, $3)', [id, userId, type]);
      scoreChange = type === 'up' ? 1 : -1;
    }

    // Skoru güncelle
    await db.query('UPDATE comments SET score = score + $1 WHERE id = $2', [scoreChange, id]);
    
    const commentRes = await db.query('SELECT post_id FROM comments WHERE id = $1', [id]);
    const comment = commentRes.rows[0];
    if (!comment) return res.status(404).json({ error: 'Yorum bulunamadı' });

    const allCommentsRes = await db.query(`
      SELECT c.*, u.ad as author_name,
      (SELECT vote_type FROM comment_votes v WHERE v.comment_id = c.id AND v.user_id = $2) as user_vote
      FROM comments c 
      LEFT JOIN users u ON c.author_id = u.email 
      WHERE c.post_id = $1 
      ORDER BY c.created_at ASC
    `, [comment.post_id, userId]);

    res.json(allCommentsRes.rows);
  } catch (error) {
    console.error('Yorum oylama hatası:', error);
    res.status(500).json({ error: 'Oy işlemi tamamlanamadı.' });
  }
});

// --- BİLDİRİMLER ---

// Kullanıcının bildirimlerini getir
app.get('/api/notifications/:email', requireAuth, async (req, res) => {
  const { email } = req.params;
  if (email !== req.user.email) {
    return res.status(403).json({ error: 'Yetkisiz erişim' });
  }

  try {
    const notificationsRes = await db.query(`
      SELECT n.*, p.content as post_content, u.ad as actor_name 
      FROM notifications n 
      LEFT JOIN posts p ON n.post_id = p.id 
      LEFT JOIN users u ON n.actor_id = u.email
      WHERE n.user_id = $1 
      ORDER BY n.created_at DESC 
      LIMIT 20
    `, [email]);
    res.json(notificationsRes.rows);
  } catch (error) {
    console.error('Bildirim getirme hatası:', error);
    res.status(500).json({ error: 'Bildirimler yüklenemedi.' });
  }
});

// Bildirimi okundu olarak işaretle
app.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz bildirim kimliği.' });

  try {
    const notifRes = await db.query('SELECT * FROM notifications WHERE id = $1', [id]);
    const notif = notifRes.rows[0];
    if (!notif) {
      return res.status(404).json({ error: 'Bildirim bulunamadı' });
    }
    if (notif.user_id !== req.user.email) {
      return res.status(403).json({ error: 'Bu bildirimi değiştirme yetkiniz yok' });
    }

    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
    res.json({ message: 'Okundu' });
  } catch (error) {
    console.error('Bildirim güncelleme hatası:', error);
    res.status(500).json({ error: 'Bildirim güncellenemedi.' });
  }
});

// --- AUTH ENDPOINTS ---

// 🛡️ Kayıt Ol (Mass Assignment Koruması, Girdi Doğrulaması)
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { email, password, ad } = req.body;
  if (!email || !password || !ad || typeof email !== 'string' || typeof password !== 'string' || typeof ad !== 'string') {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanAd = ad.trim();

  if (cleanAd.length > 100) {
    return res.status(400).json({ error: 'İsim en fazla 100 karakter olabilir.' });
  }

  if (password.length < 6 || password.length > 128) {
    return res.status(400).json({ error: 'Şifre en az 6, en fazla 128 karakter olmalıdır.' });
  }

  // E-posta formatı kontrolü
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz' });
  }

  try {
    // Kullanıcı var mı kontrol et
    const existingRes = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existingRes.rows[0]) return res.status(400).json({ error: 'Bu e-posta zaten kullanımda' });

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kaydet - Rol her zaman varsayılan 'USER' olarak yazılır
    await db.query('INSERT INTO users (email, password, ad, role) VALUES ($1, $2, $3, $4)', [cleanEmail, hashedPassword, cleanAd, 'USER']);

    res.status(201).json({ message: 'Kayıt başarılı' });
  } catch (error) {
    console.error('Kayıt hatası:', error);
    res.status(500).json({ error: 'Kayıt işlemi sırasında bir hata oluştu.' });
  }
});

// 🛡️ Giriş Yap (Brute-Force Koruması, Zamanlama Saldırısı Koruması)
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    const user = userRes.rows[0];
    if (!user) return res.status(400).json({ error: 'Hatalı e-posta veya şifre' });

    // Şifreyi kontrol et
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Hatalı e-posta veya şifre' });

    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: String(user.role || 'USER').toUpperCase() },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ ...userWithoutPassword, token });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ error: 'Giriş yapılırken bir hata oluştu.' });
  }
});

// 🛡️ Çıkış Yap
app.post('/api/auth/logout', requireAuth, (req, res) => {
  res.json({ success: true, message: 'Oturum güvenli bir şekilde kapatıldı.' });
});

// 🛡️ Hesabı Gerçekten Sil (GDPR / KVKK Unutulma Hakkı & Güvenli Cascade Silme)
app.delete('/api/users/me', requireAuth, async (req, res) => {
  const userEmail = req.user?.email;
  if (!userEmail) {
    return res.status(401).json({ error: 'Yetkilendirme hatası.' });
  }

  try {
    // 1. Kullanıcının bildirimlerini sil
    await db.query('DELETE FROM notifications WHERE user_id = $1', [userEmail]);

    // 2. Kullanıcının takip ilişkilerini sil
    await db.query('DELETE FROM user_follows WHERE follower_id = $1 OR following_id = $1', [userEmail]);

    // 3. Kullanıcının bilgelik kategori takiplerini sil
    await db.query('DELETE FROM follows WHERE user_id = $1', [userEmail]);

    // 4. Kullanıcının beğeni / desteklerini sil
    await db.query('DELETE FROM supports WHERE user_id = $1', [userEmail]);

    // 5. Kullanıcının yorum oylarını sil
    await db.query('DELETE FROM comment_votes WHERE user_id = $1', [userEmail]);

    // 6. Kullanıcının yorumlarını sil
    await db.query('DELETE FROM comments WHERE author_id = $1', [userEmail]);

    // 7. Kullanıcının gönderilerini sil
    await db.query('DELETE FROM posts WHERE author_id = $1', [userEmail]);

    // 8. Kullanıcının anlık mesajlarını sil
    await db.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [userEmail]);

    // 9. Kullanıcı ana kaydını sil
    await db.query('DELETE FROM users WHERE email = $1', [userEmail]);

    console.log(`🗑️ [HESAP SİLİNDİ]: ${userEmail} kullanıcısına ait tüm veriler kalıcı olarak temizlendi.`);
    res.json({ success: true, message: 'Hesabınız ve tüm verileriniz kalıcı olarak silindi.' });
  } catch (error) {
    console.error('Hesap silme hatası:', error);
    res.status(500).json({ error: 'Hesap silinirken bir hata oluştu.' });
  }
});

// Kullanıcı arama (Ruh Arama ve Keşif - SQL Wildcard ve Enjeksiyon Korumalı)
app.get('/api/users/search', async (req, res) => {
  const { q, currentUserId } = req.query;
  if (!q || typeof q !== 'string' || !q.trim()) return res.json([]);

  // SQL LIKE karakterlerini escape et (%, _, \)
  const sanitizedTerm = q.trim().replace(/[%_\\]/g, '\\$&');
  const searchTerm = `%${sanitizedTerm}%`;
  const currentUser = req.user?.email || (typeof currentUserId === 'string' ? currentUserId.trim() : '');

  try {
    const query = `
      SELECT u.id, u.email, u.ad, u.role, u.created_at,
      (SELECT COUNT(*)::int FROM user_follows WHERE following_id = u.email) as follower_count,
      (SELECT COUNT(*)::int FROM user_follows WHERE follower_id = u.email) as following_count
      FROM users u
      WHERE (LOWER(u.ad) LIKE LOWER($1) ESCAPE '\\' OR LOWER(u.email) LIKE LOWER($1) ESCAPE '\\')
      AND (u.email != $2 OR $2 = '')
      LIMIT 20
    `;
    const result = await db.query(query, [searchTerm, currentUser]);

    // Takip durumu kontrolü
    const usersWithFollowing = await Promise.all(
      result.rows.map(async (u) => {
        let is_following = false;
        if (currentUser) {
          const followCheck = await db.query(
            'SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2 LIMIT 1',
            [currentUser, u.email]
          );
          is_following = followCheck.rows.length > 0;
        }
        return {
          ...u,
          is_following,
          following_count: parseInt(u.following_count || 0, 10),
          follower_count: parseInt(u.follower_count || 0, 10)
        };
      })
    );

    res.json(usersWithFollowing);
  } catch (error) {
    console.error('Kullanıcı arama hatası:', error);
    res.status(500).json({ error: 'Kullanıcılar aranırken bir hata oluştu.' });
  }
});

// --- ADMIN ENDPOINTS ---

// 🛡️ Manuel / Otomatik Yedekleme Tetikleyici
app.post('/api/admin/backup', requireAuth, requireAdmin, (req, res) => {
  const { backupDatabase } = require('./utils/backupDb.cjs');
  const result = backupDatabase();
  if (result.success) {
    res.json({ message: 'Veritabanı yedeği başarıyla alındı.', file: result.file });
  } else {
    res.status(500).json({ error: result.error || 'Yedekleme başarısız oldu.' });
  }
});

// İstatistikleri getir
app.get('/api/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await db.query('SELECT COUNT(*)::int as count FROM users');
    const totalPosts = await db.query('SELECT COUNT(*)::int as count FROM posts');
    const repairedPosts = await db.query('SELECT COUNT(*)::int as count FROM posts WHERE is_repaired = TRUE');
    const totalSupports = await db.query('SELECT COUNT(*)::int as count FROM supports');

    res.json({ 
      totalUsers: totalUsers.rows[0].count, 
      totalPosts: totalPosts.rows[0].count, 
      repairedPosts: repairedPosts.rows[0].count, 
      totalSupports: totalSupports.rows[0].count 
    });
  } catch (error) {
    console.error('Admin istatistik hatası:', error);
    res.status(500).json({ error: 'İstatistikler alınamadı.' });
  }
});

// Tüm kullanıcıları getir
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await db.query('SELECT id, email, ad, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users.rows);
  } catch (error) {
    console.error('Admin kullanıcıları listeleme hatası:', error);
    res.status(500).json({ error: 'Kullanıcılar getirilemedi.' });
  }
});

// Kullanıcı rolünü güncelle (Role Whitelist Doğrulamalı)
app.put('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz kullanıcı kimliği.' });

  const { role } = req.body;
  const ALLOWED_ROLES = ['USER', 'ADMIN', 'BILGE'];
  const normalizedRole = String(role || '').trim().toUpperCase();

  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    return res.status(400).json({ error: `Geçersiz rol. İzin verilen roller: ${ALLOWED_ROLES.join(', ')}` });
  }

  try {
    await db.query('UPDATE users SET role = $1 WHERE id = $2', [normalizedRole, id]);
    res.json({ message: 'Rol başarıyla güncellendi' });
  } catch (error) {
    console.error('Admin rol güncelleme hatası:', error);
    res.status(500).json({ error: 'Rol güncellenemedi.' });
  }
});

// Admin: Kullanıcı Sil (Cascade Temizlik & Kendi Kendini Silme Engeli)
app.delete('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz kullanıcı kimliği.' });

  try {
    const userRes = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    const targetUser = userRes.rows[0];
    if (!targetUser) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    if (targetUser.email === req.user.email) {
      return res.status(400).json({ error: 'Kendi yönetici hesabınızı silemezsiniz.' });
    }

    const email = targetUser.email;
    await db.query('DELETE FROM user_follows WHERE follower_id = $1 OR following_id = $1', [email]);
    await db.query('DELETE FROM follows WHERE user_id = $1', [email]);
    await db.query('DELETE FROM comment_votes WHERE user_id = $1', [email]);
    await db.query('DELETE FROM notifications WHERE user_id = $1 OR actor_id = $1', [email]);
    await db.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [email]);
    await db.query('DELETE FROM reports WHERE reporter_email = $1 OR reported_user_email = $1', [email]);
    await db.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'Kullanıcı ve ilişkili tüm verileri başarıyla silindi.' });
  } catch (error) {
    console.error('Admin kullanıcı silme hatası:', error);
    res.status(500).json({ error: 'Kullanıcı silinemedi.' });
  }
});

// --- ŞİKAYET & RAPORLAMA (REPORTS) SİSTEMİ ---

// Yeni Şikayet Oluştur
app.post('/api/reports', requireAuth, async (req, res) => {
  const reporterEmail = req.user.email;
  const { post_id, comment_id, reported_user_email, reason, details } = req.body;

  if (!reason || typeof reason !== 'string') {
    return res.status(400).json({ error: 'Şikayet nedeni belirtilmelidir.' });
  }

  const cleanReason = reason.trim().slice(0, 100);
  const cleanDetails = details ? String(details).trim().slice(0, 500) : null;
  const safePostId = post_id ? parseInt(post_id, 10) : null;
  const safeCommentId = comment_id ? parseInt(comment_id, 10) : null;

  try {
    const result = await db.query(
      `INSERT INTO reports (reporter_email, post_id, comment_id, reported_user_email, reason, details)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [reporterEmail, safePostId, safeCommentId, reported_user_email || null, cleanReason, cleanDetails]
    );
    res.status(201).json({ message: 'Şikayetiniz yönetici paneline iletildi. Hassasiyetiniz için teşekkür ederiz.', report: result.rows[0] });
  } catch (error) {
    console.error('Şikayet oluşturma hatası:', error);
    res.status(500).json({ error: 'Şikayet iletilemedi.' });
  }
});

// Admin: Tüm Şikayetleri Listele
app.get('/api/admin/reports', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT r.*, 
             p.content as post_content, 
             p.author_name as post_author_name,
             c.content as comment_content,
             c.author_name as comment_author_name
      FROM reports r
      LEFT JOIN posts p ON r.post_id = p.id
      LEFT JOIN comments c ON r.comment_id = c.id
      ORDER BY r.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Şikayet listeleme hatası:', error);
    res.status(500).json({ error: 'Şikayetler yüklenemedi.' });
  }
});

// Admin: Şikayet Durumu Güncelle (OPEN, RESOLVED, DISMISSED)
app.put('/api/admin/reports/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;
  if (isNaN(id) || !['RESOLVED', 'DISMISSED', 'OPEN'].includes(status)) {
    return res.status(400).json({ error: 'Geçersiz şikayet durumu.' });
  }

  try {
    await db.query('UPDATE reports SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Şikayet durumu güncellendi.' });
  } catch (error) {
    console.error('Şikayet güncelleme hatası:', error);
    res.status(500).json({ error: 'Şikayet güncellenemedi.' });
  }
});

// Admin: Şikayet Edilen İçeriği Doğrudan Sil ve Şikayeti Çözüldü Yap
app.delete('/api/admin/reports/:id/content', requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz şikayet kimliği.' });

  try {
    const reportRes = await db.query('SELECT * FROM reports WHERE id = $1', [id]);
    const report = reportRes.rows[0];
    if (!report) return res.status(404).json({ error: 'Şikayet bulunamadı.' });

    if (report.post_id) {
      await db.query('DELETE FROM posts WHERE id = $1', [report.post_id]);
    } else if (report.comment_id) {
      await db.query('DELETE FROM comments WHERE id = $1', [report.comment_id]);
    }

    await db.query("UPDATE reports SET status = 'RESOLVED' WHERE id = $1", [id]);
    res.json({ message: 'İçerik kaldırıldı ve şikayet çözüldü olarak işaretlendi.' });
  } catch (error) {
    console.error('Şikayetli içerik silme hatası:', error);
    res.status(500).json({ error: 'İçerik kaldırılamadı.' });
  }
});

// --- CANLI ÇEMBERLER (CIRCLES) API ---

// Tüm Çemberleri ve Canlı Aktif Sayılarını Getir
app.get('/api/circles', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM circles ORDER BY created_at ASC');
    const circlesWithPresence = result.rows.map(c => {
      const roomName = c.id.startsWith('circle_') ? c.id : `circle_${c.id}`;
      const activeCount = io.sockets.adapter.rooms.get(roomName)?.size || 0;
      return {
        ...c,
        active_users: activeCount
      };
    });
    res.json(circlesWithPresence);
  } catch (error) {
    console.error('Çember listeleme hatası:', error);
    res.status(500).json({ error: 'Çemberler yüklenemedi.' });
  }
});

// Yeni Çember Oluştur (Yalnızca Bilge ve Adminler)
app.post('/api/circles', requireAuth, async (req, res) => {
  const userRole = String(req.user.role || '').toUpperCase();
  if (userRole !== 'BILGE' && userRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Yalnızca Bilge veya Yönetici rolündeki ruhlar yeni çember açabilir.' });
  }

  const { title, subtitle, color } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Çember başlığı zorunludur.' });
  }

  const cleanTitle = title.trim().slice(0, 100);
  const cleanSubtitle = subtitle ? String(subtitle).trim().slice(0, 255) : 'Birlikte içsel dinginliğe ve ortak şifaya odaklanma alanı.';
  const cleanColor = color && /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#D4AF37';
  const circleId = 'circle_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  try {
    const result = await db.query(
      `INSERT INTO circles (id, title, subtitle, color, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [circleId, cleanTitle, cleanSubtitle, cleanColor, req.user.email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Çember oluşturma hatası:', error);
    res.status(500).json({ error: 'Çember oluşturulamadı.' });
  }
});

// --- WISDOM CATEGORIES ---

app.get('/api/wisdom/categories', async (req, res) => {
  try {
    const userId = req.query.userId;
    let categories;
    if (userId) {
      const result = await db.query(`
        SELECT c.*, 
        (SELECT COUNT(*)::int FROM follows f WHERE f.category_id = c.id AND f.user_id = $1) as is_followed,
        (SELECT COUNT(*)::int FROM follows f WHERE f.category_id = c.id) as follower_count,
        CASE WHEN c.created_by = $2 THEN 1 ELSE 0 END as is_owner
        FROM wisdom_categories c
      `, [userId, userId]);
      categories = result.rows;
    } else {
      const result = await db.query(`
        SELECT c.*, 
        (SELECT COUNT(*)::int FROM follows f WHERE f.category_id = c.id) as follower_count
        FROM wisdom_categories c
      `);
      categories = result.rows;
    }
    res.json(categories);
  } catch (error) {
    console.error('Bilgelik kategorileri hatası:', error);
    res.status(500).json({ error: 'Kategoriler yüklenemedi.' });
  }
});

app.post('/api/wisdom/categories', requireAuth, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.email; // JWT'den alınan email
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Kategori adı gerekli' });
  }

  const cleanName = name.trim().slice(0, 100);
  const slug = cleanName.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  try {
    // Yetki Kontrolü
    const userRes = await db.query('SELECT role FROM users WHERE email = $1', [userId]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const userRole = String(user.role || '').toUpperCase();

    if (userRole !== 'ADMIN') {
      const totalUsersRes = await db.query('SELECT COUNT(*)::int as count FROM users');
      const totalUsers = totalUsersRes.rows[0].count;

      const userScoreRes = await db.query('SELECT COALESCE(SUM(score), 0)::int as score FROM comments WHERE author_id = $1', [userId]);
      const userScore = userScoreRes.rows[0].score;

      const userCommentsCountRes = await db.query('SELECT COUNT(*)::int as count FROM comments WHERE author_id = $1', [userId]);
      const commentCount = userCommentsCountRes.rows[0].count;

      const userSupportsCountRes = await db.query('SELECT COUNT(*)::int as count FROM supports WHERE user_id = $1', [userId]);
      const supportCount = userSupportsCountRes.rows[0].count;

      // Akıllı & Kademeli Taban Eşik
      const minRequiredScore = Math.max(50, Math.floor(totalUsers * 0.5));
      const minRequiredComments = 5;
      const minRequiredSupports = 10;

      if (userScore < minRequiredScore || commentCount < minRequiredComments || supportCount < minRequiredSupports) {
        return res.status(403).json({ 
          error: `Bilgelik kategorisi açabilmek için Bilge seviyesine ulaşmalısınız. Gereksinimler: En az ${minRequiredScore} yorum beğenisi (Mevcut: ${userScore}), en az ${minRequiredComments} destekleyici yorum (Mevcut: ${commentCount}), en az ${minRequiredSupports} altın dikiş (Mevcut: ${supportCount}).` 
        });
      }

      // Koşulu sağlıyorsa 'BILGE' yapalım
      if (userRole === 'USER') {
        await db.query("UPDATE users SET role = 'BILGE' WHERE email = $1", [userId]);
      }
    }

    const info = await db.query('INSERT INTO wisdom_categories (name, slug, created_by) VALUES ($1, $2, $3) RETURNING *', [cleanName, slug, userId]);
    res.status(201).json(info.rows[0]);
  } catch (error) {
    if (error.message.includes('unique') || error.message.includes('UNIQUE')) {
      const existing = await db.query('SELECT * FROM wisdom_categories WHERE name = $1', [cleanName]);
      return res.json(existing.rows[0]);
    }
    console.error('Kategori oluşturma hatası:', error);
    res.status(500).json({ error: 'Kategori oluşturulamadı.' });
  }
});

app.post('/api/wisdom/follow', requireAuth, async (req, res) => {
  const userId = req.user.email;
  const categoryId = parseInt(req.body.categoryId, 10);
  if (isNaN(categoryId)) return res.status(400).json({ error: 'Geçersiz kategori kimliği.' });

  try {
    const existing = await db.query('SELECT * FROM follows WHERE user_id = $1 AND category_id = $2', [userId, categoryId]);
    if (existing.rows[0]) {
      await db.query('DELETE FROM follows WHERE user_id = $1 AND category_id = $2', [userId, categoryId]);
      res.json({ message: 'Takibi bıraktı', is_followed: false });
    } else {
      await db.query('INSERT INTO follows (user_id, category_id) VALUES ($1, $2)', [userId, categoryId]);
      res.json({ message: 'Takip ediliyor', is_followed: true });
    }
  } catch (error) {
    console.error('Kategori takip hatası:', error);
    res.status(500).json({ error: 'Takip işlemi gerçekleştirilemedi.' });
  }
});

app.delete('/api/wisdom/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Geçersiz kategori kimliği.' });

  try {
    await db.query('DELETE FROM wisdom_categories WHERE id = $1', [id]);
    res.json({ message: 'Kategori silindi' });
  } catch (error) {
    console.error('Kategori silme hatası:', error);
    res.status(500).json({ error: 'Kategori silinemedi.' });
  }
});

// --- USER FOLLOWS ENDPOINTS ---

app.post('/api/users/follow', requireAuth, async (req, res) => {
  const followerEmail = req.user.email;
  const { followingEmail } = req.body;
  
  if (!followingEmail || typeof followingEmail !== 'string') {
    return res.status(400).json({ error: 'Takip edilecek kullanıcı gerekli' });
  }
  const cleanFollowingEmail = followingEmail.trim().toLowerCase();

  if (followerEmail === cleanFollowingEmail) {
    return res.status(400).json({ error: 'Kendinizi takip edemezsiniz' });
  }

  try {
    const existing = await db.query('SELECT * FROM user_follows WHERE follower_id = $1 AND following_id = $2', [followerEmail, cleanFollowingEmail]);
    if (existing.rows[0]) {
      await db.query('DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2', [followerEmail, cleanFollowingEmail]);
      res.json({ message: 'Takibi bıraktı', is_followed: false });
    } else {
      await db.query('INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)', [followerEmail, cleanFollowingEmail]);
      res.json({ message: 'Takip edildi', is_followed: true });
    }
  } catch (error) {
    console.error('Kullanıcı takip hatası:', error);
    res.status(500).json({ error: 'Takip işlemi yapılamadı.' });
  }
});

app.get('/api/users/:email/network', async (req, res) => {
  const { email } = req.params;
  const currentUserId = req.query.currentUserId;

  try {
    const followers = await db.query(
      'SELECT u.email, u.ad, u.role FROM user_follows f JOIN users u ON f.follower_id = u.email WHERE f.following_id = $1',
      [email]
    );
    const following = await db.query(
      'SELECT u.email, u.ad, u.role FROM user_follows f JOIN users u ON f.following_id = u.email WHERE f.follower_id = $1',
      [email]
    );
    
    let is_following = false;
    if (currentUserId) {
      const check = await db.query('SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2', [currentUserId, email]);
      is_following = check.rows.length > 0;
    }

    res.json({
      followers: followers.rows,
      following: following.rows,
      is_following
    });
  } catch (error) {
    console.error('Kullanıcı ağı hatası:', error);
    res.status(500).json({ error: 'Kullanıcı bağlantıları alınamadı.' });
  }
});

// --- DIRECT MESSAGES ENDPOINTS ---

app.get('/api/messages/:otherEmail', requireAuth, async (req, res) => {
  const currentEmail = req.user.email;
  const { otherEmail } = req.params;

  try {
    const result = await db.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
          OR (sender_id = $2 AND receiver_id = $1) 
       ORDER BY created_at ASC`,
      [currentEmail, otherEmail]
    );

    await db.query(
      `UPDATE messages SET is_read = TRUE 
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [otherEmail, currentEmail]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Mesajları getirme hatası:', error);
    res.status(500).json({ error: 'Mesajlar alınamadı.' });
  }
});

app.post('/api/messages', requireAuth, messageLimiter, async (req, res) => {
  const senderEmail = req.user.email;
  const { receiverEmail, content } = req.body;

  if (!receiverEmail || !content || typeof receiverEmail !== 'string' || typeof content !== 'string') {
    return res.status(400).json({ error: 'Alıcı ve mesaj içeriği gerekli' });
  }

  const cleanReceiver = receiverEmail.trim().toLowerCase();
  const cleanContent = content.trim();

  if (senderEmail === cleanReceiver) {
    return res.status(400).json({ error: 'Kendinize mesaj gönderemezsiniz.' });
  }

  if (cleanContent.length > 2000) {
    return res.status(400).json({ error: 'Mesaj en fazla 2000 karakter olabilir.' });
  }

  const modCheck = await moderateText(cleanContent);
  if (!modCheck.isClean) {
    return res.status(400).json({ 
      error: modCheck.reason || 'Mesajınız topluluk kurallarına aykırı ifade içeriyor.',
      category: modCheck.category
    });
  }

  try {
    const result = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [senderEmail, cleanReceiver, cleanContent]
    );
    const newMessage = result.rows[0];
    const senderDisplayName = req.user.ad || senderEmail.split('@')[0];

    // 1. Veritabanına bildirim kaydet
    await db.query(
      'INSERT INTO notifications (user_id, type, actor_id, message) VALUES ($1, $2, $3, $4)',
      [cleanReceiver, 'message', senderEmail, cleanContent.slice(0, 100)]
    );

    // 2. Real-time mesaj socket eventi gönder
    io.to(cleanReceiver).emit('new_message', {
      ...newMessage,
      sender_name: senderDisplayName
    });

    // 3. Real-time bildirim socket eventi gönder
    io.to(cleanReceiver).emit('new_notification', {
      type: 'message',
      actor_id: senderEmail,
      sender_name: senderDisplayName,
      message: `${senderDisplayName} size bir mesaj gönderdi ✨`,
      timestamp: new Date()
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    res.status(500).json({ error: 'Mesaj gönderilemedi.' });
  }
});

// Production ortamında Vite build (dist) çıktılarını statik sun ve SPA yönlendirmelerini index.html'e aktar
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');

  // Statik dosyaları sun (HTML ve SW için no-cache, Asset'ler için immutable cache)
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (filePath.includes(path.sep + 'assets' + path.sep)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // Var olmayan eski /assets veya /api isteklerine HTML dönüp MIME hatası verdirtme!
  app.use('/assets', (req, res) => {
    res.status(404).json({ error: 'Asset not found or outdated build' });
  });

  // Kalan tüm sayfa yönlendirmelerini (SPA) taze index.html ile sun
  app.use((req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const { initDb } = require('./db.cjs');

server.listen(PORT, async () => {
  await initDb();
  console.log(`Gilded backend sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});
