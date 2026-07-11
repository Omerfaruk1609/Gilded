const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();
const { Server } = require('socket.io');
const db = require('./db.cjs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { containsProfanity } = require('./utils/moderation.cjs');
const { analyzeComment } = require('./utils/aiModeration.cjs');
const { generatePhilosopherWisdom } = require('./utils/philosopherBot.cjs');

const JWT_SECRET = process.env.JWT_SECRET || 'gilded-secret-key-123';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'server/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});


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
  console.log('Bir kullanıcı bağlandı (Güvenli):', socket.id, socket.user.email);

  // Kullanıcıyı kendi e-posta adresine ait odaya otomatik olarak al (Güvenli)
  socket.join(socket.user.email);
  console.log(`Kullanıcı ${socket.user.email} kendi güvenli odasına otomatik katıldı.`);

  // Eski join eventi uyumluluk için tutuluyor ancak parametre olarak gelen userId'ye güvenmek yerine socket.user.email kullanılıyor
  socket.on('join', () => {
    socket.join(socket.user.email);
    console.log(`Kullanıcı ${socket.user.email} (güvenli) odasına katıldı.`);
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.user.email);
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
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ error: 'Bu işlem için yönetici yetkisi gerekiyor.' });
  }
};

// --- API ENDPOINTS ---

// Tüm postları getir
app.get('/api/posts', async (req, res) => {
  const userId = req.query.userId;
  try {
    const postType = req.query.postType || 'normal'; // Varsayılan: normal postlar
    let postsResult;
    const isRepairedFilter = req.query.repaired === 'true' ? 'AND p.is_repaired = TRUE' : '';

    if (userId) {
      if (postType === 'wisdom') {
        if (req.query.categoryId) {
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
          `;
          postsResult = await db.query(query, [userId, postType, req.query.categoryId, userId]);
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
          `;
          postsResult = await db.query(query, [userId, postType, userId]);
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
        `;
        postsResult = await db.query(query, [userId, postType]);
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
        `;
        postsResult = await db.query(query);
      }
    }
    
    const posts = postsResult.rows;

    // Hacker News / Reddit benzeri Sıcaklık Algoritması
    posts.sort((a, b) => {
      const hoursA = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60);
      const hoursB = (Date.now() - new Date(b.created_at).getTime()) / (1000 * 60 * 60);
      const scoreA = (a.support_count + 1) / Math.pow(hoursA + 2, 1.5);
      const scoreB = (b.support_count + 1) / Math.pow(hoursB + 2, 1.5);
      return scoreB - scoreA;
    });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

// Tekil post getir
app.get('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
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
    res.status(500).json({ error: error.message });
  }
});

// Post için felsefi tavsiye / kadim bilgelik üret
app.post('/api/posts/:id/philosopher-wisdom', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const postRes = await db.query('SELECT * FROM posts WHERE id = $1', [id]);
    const post = postRes.rows[0];
    if (!post) return res.status(404).json({ error: 'Post bulunamadı' });

    const wisdom = await generatePhilosopherWisdom(post.content, post.mood);
    res.json(wisdom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bir postun yorumlarını getir
app.get('/api/posts/:id/comments', async (req, res) => {
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
    const result = await db.query(query, [req.params.id, userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni post ekle
app.post('/api/posts', requireAuth, upload.single('image'), async (req, res) => {
  const { content, post_type = 'normal', category_id = null, is_anonymous = 1, mood = null } = req.body;
  const author_id = req.user.email; // JWT'den alınan kimlik
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  if (!content) return res.status(400).json({ error: 'İçerik gerekli' });

  if (containsProfanity(content)) {
    return res.status(400).json({ error: 'Topluluk kurallarına aykırı ifade tespit edildi.' });
  }

  try {
    // Yetki Kontrolü
    const userRes = await db.query('SELECT role FROM users WHERE email = $1', [author_id]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    if (post_type === 'wisdom' && user.role !== 'ADMIN' && user.role !== 'BILGE') {
      return res.status(403).json({ error: 'Bilgelik sözü paylaşma yetkiniz yok.' });
    }

    // Bilge ise sadece kendisinin açtığı kategorilere atabilir
    if (post_type === 'wisdom' && user.role === 'BILGE' && category_id) {
      const catRes = await db.query('SELECT created_by FROM wisdom_categories WHERE id = $1', [category_id]);
      const category = catRes.rows[0];
      if (!category || category.created_by !== author_id) {
        return res.status(403).json({ error: 'Sadece kendi oluşturduğunuz kategorilerde paylaşım yapabilirsiniz.' });
      }
    }

    const isAnonBool = (is_anonymous === '1' || is_anonymous === 1 || is_anonymous === 'true' || is_anonymous === true);
    const insertQuery = `
      INSERT INTO posts (content, author_id, image_url, post_type, is_anonymous, category_id, mood) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *
    `;
    const insertRes = await db.query(insertQuery, [content, author_id, image_url, post_type, isAnonBool, category_id ? parseInt(category_id) : null, mood]);
    res.status(201).json(insertRes.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dikiş At (Destekle) - Her kullanıcı bir kez atabilir
app.post('/api/posts/:id/support', requireAuth, async (req, res) => {
  const { id } = req.params;
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

    await db.query('UPDATE posts SET support_count = $1, is_repaired = $2 WHERE id = $3', [newSupportCount, isRepaired, id]);

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
    res.status(500).json({ error: error.message });
  }
});

// Yorum At
app.post('/api/posts/:id/comments', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const author_id = req.user.email; // JWT'den alınan kimlik
  
  if (!content) return res.status(400).json({ error: 'Mesaj içeriği gerekli' });
  
  if (containsProfanity(content)) {
    return res.status(400).json({ error: 'Topluluk kurallarına aykırı ifade tespit edildi.' });
  }

  try {
    // AI Moderasyonu
    const aiVerdict = await analyzeComment(content);
    if (aiVerdict === 'REJECT') {
      return res.status(400).json({ 
        error: 'Bu mesaj topluluk ruhuna (destekleyici ve iyileştirici olma) uygun bulunmadı. Lütfen daha nazik ve destekleyici bir dil kullanmayı dene.' 
      });
    }

    const parentId = req.body.parent_id || null;
    await db.query(
      'INSERT INTO comments (post_id, content, author_id, parent_id, is_anonymous) VALUES ($1, $2, $3, $4, $5)',
      [id, content, author_id, parentId, true]
    );
    
    // Bildirim oluştur
    const postRes = await db.query('SELECT author_id FROM posts WHERE id = $1', [id]);
    const post = postRes.rows[0];

    if (parentId) {
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
    res.status(500).json({ error: error.message });
  }
});

// Altın Yaprak Ver (Teşekkür)
app.post('/api/comments/:id/gold-leaf', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE comments SET gold_leaves = gold_leaves + 1 WHERE id = $1', [id]);
    const commentRes = await db.query('SELECT * FROM comments WHERE id = $1', [id]);
    res.json(commentRes.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post Sil
app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const postRes = await db.query('SELECT author_id FROM posts WHERE id = $1', [id]);
    const post = postRes.rows[0];
    if (!post) return res.status(404).json({ error: 'Post bulunamadı' });

    if (post.author_id !== req.user.email && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Bu postu silme yetkiniz yok.' });
    }

    await db.query('DELETE FROM posts WHERE id = $1', [id]);
    res.json({ message: 'Post silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yorum Sil
app.delete('/api/comments/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const commentRes = await db.query(`
      SELECT c.author_id, p.author_id as post_author_id 
      FROM comments c 
      JOIN posts p ON c.post_id = p.id 
      WHERE c.id = $1
    `, [id]);
    const comment = commentRes.rows[0];
    if (!comment) return res.status(404).json({ error: 'Yorum bulunamadı' });

    if (comment.author_id !== req.user.email && comment.post_author_id !== req.user.email && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Bu yorumu silme yetkiniz yok.' });
    }

    await db.query('DELETE FROM comments WHERE id = $1', [id]);
    res.json({ message: 'Yorum silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yorum Puanla (Vote)
app.post('/api/comments/:id/vote', requireAuth, async (req, res) => {
  const { id } = req.params;
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
    res.status(500).json({ error: error.message });
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
      SELECT n.*, p.content as post_content 
      FROM notifications n 
      LEFT JOIN posts p ON n.post_id = p.id 
      WHERE n.user_id = $1 
      ORDER BY n.created_at DESC 
      LIMIT 20
    `, [email]);
    res.json(notificationsRes.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bildirimi okundu olarak işaretle
app.put('/api/notifications/:id/read', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
    res.json({ message: 'Okundu' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- AUTH ENDPOINTS ---

// Kayıt Ol
app.post('/api/auth/register', async (req, res) => {
  const { email, password, ad } = req.body;
  if (!email || !password || !ad) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur' });
  }

  try {
    // Kullanıcı var mı kontrol et
    const existingRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingRes.rows[0]) return res.status(400).json({ error: 'Bu e-posta zaten kullanımda' });

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kaydet
    await db.query('INSERT INTO users (email, password, ad) VALUES ($1, $2, $3)', [email, hashedPassword, ad]);

    res.status(201).json({ message: 'Kayıt başarılı' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Giriş Yap
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
  }

  try {
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];
    if (!user) return res.status(400).json({ error: 'Hatalı e-posta veya şifre' });

    // Şifreyi kontrol et
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Hatalı e-posta veya şifre' });

    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ ...userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ADMIN ENDPOINTS ---

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
    res.status(500).json({ error: error.message });
  }
});

// Tüm kullanıcıları getir
app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await db.query('SELECT id, email, ad, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcı rolünü güncelle
app.put('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  try {
    await db.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    res.json({ message: 'Rol güncellendi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wisdom/categories', requireAuth, async (req, res) => {
  const { name } = req.body;
  const userId = req.user.email; // JWT'den alınan email
  if (!name) return res.status(400).json({ error: 'Kategori adı gerekli' });
  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  try {
    // Yetki Kontrolü: Admin değilse toplam kullanıcı sayısı kadar pozitif yorum skoru gerekiyor
    const userRes = await db.query('SELECT role FROM users WHERE email = $1', [userId]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    if (user.role !== 'ADMIN') {
      const totalUsersRes = await db.query('SELECT COUNT(*)::int as count FROM users');
      const totalUsers = totalUsersRes.rows[0].count;

      const userScoreRes = await db.query('SELECT COALESCE(SUM(score), 0)::int as score FROM comments WHERE author_id = $1', [userId]);
      const userScore = userScoreRes.rows[0].score;

      if (userScore < totalUsers) {
        return res.status(403).json({ 
          error: `Bilgelik kategorisi açabilmek için en az toplam kullanıcı sayısı kadar (${totalUsers}) yorum beğenisi (skoru) toplamanız gerekmektedir. Mevcut skorunuz: ${userScore}` 
        });
      }

      // Koşulu sağlıyorsa ve 'user' rolündeyse 'BILGE' yapalım
      if (user.role === 'user') {
        await db.query("UPDATE users SET role = 'BILGE' WHERE email = $1", [userId]);
      }
    }

    const info = await db.query('INSERT INTO wisdom_categories (name, slug, created_by) VALUES ($1, $2, $3) RETURNING *', [name, slug, userId]);
    res.status(201).json(info.rows[0]);
  } catch (error) {
    if (error.message.includes('unique') || error.message.includes('UNIQUE')) {
      const existing = await db.query('SELECT * FROM wisdom_categories WHERE name = $1', [name]);
      return res.json(existing.rows[0]);
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wisdom/follow', requireAuth, async (req, res) => {
  const userId = req.user.email; // JWT'den
  const { categoryId } = req.body;
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
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/wisdom/categories/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM wisdom_categories WHERE id = $1', [id]);
    res.json({ message: 'Kategori silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- USER FOLLOWS ENDPOINTS ---

app.post('/api/users/follow', requireAuth, async (req, res) => {
  const followerEmail = req.user.email;
  const { followingEmail } = req.body;
  
  if (!followingEmail) return res.status(400).json({ error: 'Takip edilecek kullanıcı gerekli' });
  if (followerEmail === followingEmail) return res.status(400).json({ error: 'Kendinizi takip edemezsiniz' });

  try {
    const existing = await db.query('SELECT * FROM user_follows WHERE follower_id = $1 AND following_id = $2', [followerEmail, followingEmail]);
    if (existing.rows[0]) {
      await db.query('DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2', [followerEmail, followingEmail]);
      res.json({ message: 'Takibi bıraktı', is_followed: false });
    } else {
      await db.query('INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)', [followerEmail, followingEmail]);
      res.json({ message: 'Takip edildi', is_followed: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
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
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/messages', requireAuth, async (req, res) => {
  const senderEmail = req.user.email;
  const { receiverEmail, content } = req.body;

  if (!receiverEmail || !content) {
    return res.status(400).json({ error: 'Alıcı ve mesaj içeriği gerekli' });
  }

  try {
    const result = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [senderEmail, receiverEmail, content]
    );
    const newMessage = result.rows[0];

    io.to(receiverEmail).emit('new_message', {
      ...newMessage,
      sender_name: req.user.ad || senderEmail.split('@')[0]
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const { initDb } = require('./db.cjs');

server.listen(PORT, async () => {
  await initDb();
  console.log(`Gilded backend sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});
