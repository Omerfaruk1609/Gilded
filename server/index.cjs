const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./db.cjs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { containsProfanity } = require('./utils/moderation.cjs');
const { analyzeComment } = require('./utils/aiModeration.cjs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'server/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage });

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`Kullanıcı ${userId} odasına katıldı.`);
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı');
  });
});

// Tüm postları getir
app.get('/api/posts', (req, res) => {
  const userId = req.query.userId;
  try {
    const postType = req.query.postType || 'normal'; // Varsayılan: normal postlar
    let posts;
    const isRepairedFilter = req.query.repaired === 'true' ? 'AND p.is_repaired = 1' : '';

    if (userId) {
      let query = `
        SELECT p.*, u.ad as author_name, c.name as category_name,
        (SELECT COUNT(*) FROM supports s WHERE s.post_id = p.id AND s.user_id = ?) as has_supported
        FROM posts p 
        LEFT JOIN users u ON p.author_id = u.email
        LEFT JOIN wisdom_categories c ON p.category_id = c.id
        WHERE p.post_type = ?
        ${isRepairedFilter}
      `;

      if (postType === 'wisdom') {
        if (req.query.categoryId) {
          // Belirli bir kategori seçildiyse: Takip kontrolü
          query += ` AND p.category_id = ${req.query.categoryId} AND EXISTS (SELECT 1 FROM follows f WHERE f.category_id = p.category_id AND f.user_id = ?)`;
          posts = db.prepare(query).all(userId, postType, userId);
        } else {
          // Genel Bilgelik Panosu: Sadece takip edilen tüm kategoriler
          query += ` AND EXISTS (SELECT 1 FROM follows f WHERE f.category_id = p.category_id AND f.user_id = ?)`;
          posts = db.prepare(query).all(userId, postType, userId);
        }
      } else {
        // Normal postlar
        posts = db.prepare(query).all(userId, postType);
      }
    } else {
      // Misafirler (Eğer varsa) sadece normal postları görsün, bilgelik gizli
      if (postType === 'wisdom') {
        posts = [];
      } else {
        const query = `
          SELECT p.*, u.ad as author_name, c.name as category_name
          FROM posts p 
          LEFT JOIN users u ON p.author_id = u.email 
          LEFT JOIN wisdom_categories c ON p.category_id = c.id
          WHERE p.post_type = 'normal'
          ${isRepairedFilter}
        `;
        posts = db.prepare(query).all();
      }
    }
    
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
app.get('/api/users/:email/posts', (req, res) => {
  const { email } = req.params;
  try {
    const posts = db.prepare('SELECT * FROM posts WHERE author_id = ? ORDER BY created_at DESC').all(email);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcı istatistiklerini getir
app.get('/api/users/:email/stats', (req, res) => {
  const { email } = req.params;
  try {
    const totalReceived = db.prepare('SELECT SUM(support_count) as total FROM posts WHERE author_id = ?').get(email);
    const totalGiven = db.prepare('SELECT COUNT(*) as total FROM supports WHERE user_id = ?').get(email);
    res.json({
      received: totalReceived.total || 0,
      given: totalGiven.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tekil post getir
app.get('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId;
  
  try {
    let query = `
      SELECT p.*, u.ad as author_name 
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.email 
      WHERE p.id = ?
    `;
    
    if (userId) {
      query = `
        SELECT p.*, u.ad as author_name,
        (SELECT COUNT(*) FROM supports s WHERE s.post_id = p.id AND s.user_id = '${userId}') as has_supported
        FROM posts p 
        LEFT JOIN users u ON p.author_id = u.email 
        WHERE p.id = ?
      `;
    }
    
    const post = db.prepare(query).get(id);
    if (!post) {
      return res.status(404).json({ error: 'Post bulunamadı' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bir postun yorumlarını getir
app.get('/api/posts/:id/comments', (req, res) => {
  try {
    const comments = db.prepare(`
      SELECT c.*, u.ad as author_name 
      FROM comments c 
      LEFT JOIN users u ON c.author_id = u.email 
      WHERE c.post_id = ? 
      ORDER BY c.created_at ASC
    `).all(req.params.id);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni post ekle
app.post('/api/posts', upload.single('image'), (req, res) => {
  const { content, author_id, post_type = 'normal', category_id = null } = req.body;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;
  if (!content) return res.status(400).json({ error: 'İçerik gerekli' });

  if (containsProfanity(content)) {
    return res.status(400).json({ error: 'Topluluk kurallarına aykırı ifade tespit edildi.' });
  }

  try {
    // Yetki Kontrolü
    const user = db.prepare('SELECT role FROM users WHERE email = ?').get(author_id);
    if (post_type === 'wisdom' && user.role !== 'ADMIN' && user.role !== 'BILGE') {
      return res.status(403).json({ error: 'Bilgelik sözü paylaşma yetkiniz yok.' });
    }

    // Bilge ise sadece kendisinin açtığı kategorilere atabilir
    if (post_type === 'wisdom' && user.role === 'BILGE' && category_id) {
      const category = db.prepare('SELECT created_by FROM wisdom_categories WHERE id = ?').get(category_id);
      if (!category || category.created_by !== author_id) {
        return res.status(403).json({ error: 'Sadece kendi oluşturduğunuz kategorilerde paylaşım yapabilirsiniz.' });
      }
    }

    const info = db.prepare('INSERT INTO posts (content, author_id, image_url, post_type, is_anonymous, category_id) VALUES (?, ?, ?, ?, ?, ?)').run(content, author_id, image_url, post_type, 1, category_id);
    const newPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dikiş At (Destekle) - Her kullanıcı bir kez atabilir
app.post('/api/posts/:id/support', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  try {
    // Önce dikiş atmış mı kontrol et
    const existing = db.prepare('SELECT * FROM supports WHERE post_id = ? AND user_id = ?').get(id, user_id);
    if (existing) return res.status(400).json({ error: 'Zaten dikiş attınız' });

    // Dikişi kaydet
    db.prepare('INSERT INTO supports (post_id, user_id) VALUES (?, ?)').run(id, user_id);

    // Postun destek sayısını artır
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    const newSupportCount = post.support_count + 1;
    const isRepaired = newSupportCount >= 5 ? 1 : 0;

    db.prepare('UPDATE posts SET support_count = ?, is_repaired = ? WHERE id = ?')
      .run(newSupportCount, isRepaired, id);

    const updatedPost = db.prepare('SELECT p.*, 1 as has_supported FROM posts p WHERE id = ?').get(id);

    // Bildirim oluştur (Eğer post sahibi kendi postuna destek atmadıysa)
    if (post.author_id !== user_id) {
      db.prepare('INSERT INTO notifications (user_id, type, post_id) VALUES (?, ?, ?)')
        .run(post.author_id, 'support', id);
      
      // Real-time bildirim gönder
      io.to(post.author_id).emit('new_notification', {
        type: 'support',
        post_id: id,
        message: 'Birisi yaranı altınla dikti...',
        timestamp: new Date()
      });
    }

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yorum At
app.post('/api/posts/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { content, author_id } = req.body;
  
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
    db.prepare('INSERT INTO comments (post_id, content, author_id, parent_id, is_anonymous) VALUES (?, ?, ?, ?, ?)')
      .run(id, content, author_id, parentId, 1);
    
    // Bildirim oluştur
    const post = db.prepare('SELECT author_id FROM posts WHERE id = ?').get(id);
    if (parentId) {
      const parentComment = db.prepare('SELECT author_id FROM comments WHERE id = ?').get(parentId);
      if (parentComment && parentComment.author_id !== author_id) {
        db.prepare('INSERT INTO notifications (user_id, type, post_id) VALUES (?, ?, ?)')
          .run(parentComment.author_id, 'comment_reply', id);
        
        io.to(parentComment.author_id).emit('new_notification', {
          type: 'comment_reply',
          post_id: id,
          message: 'Birisi destek mesajına yanıt verdi...',
          timestamp: new Date()
        });
      }
    } else if (post && post.author_id !== author_id) {
      db.prepare('INSERT INTO notifications (user_id, type, post_id) VALUES (?, ?, ?)')
        .run(post.author_id, 'post_comment', id);
      
      io.to(post.author_id).emit('new_notification', {
        type: 'post_comment',
        post_id: id,
        message: 'Yaran için yeni bir destek mesajı var...',
        timestamp: new Date()
      });
    }
    
    // Güncel ve isimli listeyi çek
    const allComments = db.prepare(`
      SELECT c.*, u.ad as author_name 
      FROM comments c 
      LEFT JOIN users u ON c.author_id = u.email 
      WHERE c.post_id = ? 
      ORDER BY c.created_at ASC
    `).all(id);
    
    res.json(allComments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post Sil
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM posts WHERE id = ?').run(id);
    res.json({ message: 'Post silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yorum Sil
app.delete('/api/comments/:id', (req, res) => {
  const { id } = req.params;
  try {
    // Yorumu sil (Cascade silme sayesinde alt yorumlar da silinebilir veya NULL kalır)
    db.prepare('DELETE FROM comments WHERE id = ?').run(id);
    res.json({ message: 'Yorum silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yorum Puanla (Vote)
app.post('/api/comments/:id/vote', (req, res) => {
  const { id } = req.params;
  const { type } = req.body; // 'up' veya 'down'
  
  try {
    const change = type === 'up' ? 1 : -1;
    db.prepare('UPDATE comments SET score = score + ? WHERE id = ?').run(change, id);
    
    // Güncel post ID'sini bulup tüm yorumları geri dön
    const comment = db.prepare('SELECT post_id FROM comments WHERE id = ?').get(id);
    const allComments = db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY score DESC, created_at ASC').all(comment.post_id);
    res.json(allComments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- BİLDİRİMLER ---

// Kullanıcının bildirimlerini getir
app.get('/api/notifications/:email', (req, res) => {
  const { email } = req.params;
  try {
    const notifications = db.prepare(`
      SELECT n.*, p.content as post_content 
      FROM notifications n 
      LEFT JOIN posts p ON n.post_id = p.id 
      WHERE n.user_id = ? 
      ORDER BY n.created_at DESC 
      LIMIT 20
    `).all(email);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bildirimi okundu olarak işaretle
app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
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
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Bu e-posta zaten kullanımda' });

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kaydet
    db.prepare('INSERT INTO users (email, password, ad) VALUES (?, ?, ?)')
      .run(email, hashedPassword, ad);

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
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(400).json({ error: 'Hatalı e-posta veya şifre' });

    // Şifreyi kontrol et
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Hatalı e-posta veya şifre' });

    // Başarılı giriş (Basitlik için tüm kullanıcı objesini dönüyoruz, gerçek projede JWT kullanılır)
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ADMIN ENDPOINTS ---

// Admin yetkisi kontrolü için yardımcı
const isAdmin = (email) => {
  const user = db.prepare('SELECT role FROM users WHERE email = ?').get(email);
  return user && user.role === 'ADMIN';
};

// İstatistikleri getir
app.get('/api/admin/stats', (req, res) => {
  const { admin_email } = req.query;
  if (!isAdmin(admin_email)) return res.status(403).json({ error: 'Yetkisiz erişim' });

  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalPosts = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;
    const repairedPosts = db.prepare('SELECT COUNT(*) as count FROM posts WHERE is_repaired = 1').get().count;
    const totalSupports = db.prepare('SELECT COUNT(*) as count FROM supports').get().count;

    res.json({ totalUsers, totalPosts, repairedPosts, totalSupports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tüm kullanıcıları getir
app.get('/api/admin/users', (req, res) => {
  const { admin_email } = req.query;
  if (!isAdmin(admin_email)) return res.status(403).json({ error: 'Yetkisiz erişim' });

  try {
    const users = db.prepare('SELECT id, email, ad, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcı rolünü güncelle
app.put('/api/admin/users/:id/role', (req, res) => {
  const { admin_email, role } = req.body;
  const { id } = req.params;

  if (!isAdmin(admin_email)) return res.status(403).json({ error: 'Yetkisiz erişim' });

  try {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    res.json({ message: 'Rol güncellendi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- WISDOM CATEGORIES ---

app.get('/api/wisdom/categories', (req, res) => {
  try {
    const userId = req.query.userId;
    let categories;
    if (userId) {
      const user = db.prepare('SELECT role FROM users WHERE email = ?').get(userId);
      // Tüm kullanıcılar (Admin, Bilge, Üye) tüm kategorileri görmeli 
      // ama Bilge sadece kendi açtığına post atabilmeli.
      categories = db.prepare(`
        SELECT c.*, 
        (SELECT COUNT(*) FROM follows f WHERE f.category_id = c.id AND f.user_id = ?) as is_followed,
        (SELECT COUNT(*) FROM follows f WHERE f.category_id = c.id) as follower_count,
        CASE WHEN c.created_by = ? THEN 1 ELSE 0 END as is_owner
        FROM wisdom_categories c
      `).all(userId, userId);
    } else {
      categories = db.prepare(`
        SELECT c.*, 
        (SELECT COUNT(*) FROM follows f WHERE f.category_id = c.id) as follower_count
        FROM wisdom_categories c
      `).all();
    }
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wisdom/categories', (req, res) => {
  const { name, userId } = req.body;
  if (!name) return res.status(400).json({ error: 'Kategori adı gerekli' });
  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  try {
    const info = db.prepare('INSERT INTO wisdom_categories (name, slug, created_by) VALUES (?, ?, ?)').run(name, slug, userId);
    res.status(201).json({ id: info.lastInsertRowid, name, slug });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      const existing = db.prepare('SELECT * FROM wisdom_categories WHERE name = ?').get(name);
      return res.json(existing);
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wisdom/follow', (req, res) => {
  const { userId, categoryId } = req.body;
  try {
    const existing = db.prepare('SELECT * FROM follows WHERE user_id = ? AND category_id = ?').get(userId, categoryId);
    if (existing) {
      db.prepare('DELETE FROM follows WHERE user_id = ? AND category_id = ?').run(userId, categoryId);
      res.json({ message: 'Takibi bıraktı', is_followed: false });
    } else {
      db.prepare('INSERT INTO follows (user_id, category_id) VALUES (?, ?)').run(userId, categoryId);
      res.json({ message: 'Takip ediliyor', is_followed: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/wisdom/categories/:id', (req, res) => {
  const { id } = req.params;
  const adminId = req.query.adminId;
  try {
    const user = db.prepare('SELECT role FROM users WHERE email = ?').get(adminId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Sadece adminler kategori silebilir.' });
    }
    db.prepare('DELETE FROM wisdom_categories WHERE id = ?').run(id);
    res.json({ message: 'Kategori silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Gilded backend sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});
