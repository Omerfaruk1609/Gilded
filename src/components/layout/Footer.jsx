import { Link as RouterLink } from 'react-router-dom'
import '../../css/footer.css'
import {
  GitHub as GitHubIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Brand & About Column */}
        <div className="footer-col brand-col">
          <div className="footer-logo">
            <h2 className="footer-title">Gilded</h2>
          </div>
          <p className="footer-desc">
            Kintsugi felsefesiyle kırılan parçalarınızı altın dikişlerle onarın, ilham alın ve toplulukla paylaşın.
          </p>
          <div className="footer-contact">
            <span className="contact-item">
              <LocationOnIcon fontSize="inherit" sx={{ color: '#D4AF37' }} /> Ankara, Türkiye
            </span>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Keşfet</h4>
          <ul className="footer-nav-list">
            <li><RouterLink to="/galeri" className="footer-link">Altın Galeri</RouterLink></li>
            <li><RouterLink to="/wisdom" className="footer-link">Günün Bilgeliği</RouterLink></li>
            <li><RouterLink to="/circles" className="footer-link">Halkalar (Circles)</RouterLink></li>
            <li><RouterLink to="/about" className="footer-link">Hakkımızda & Ekip</RouterLink></li>
          </ul>
        </div>

        {/* Support & Legal Column */}
        <div className="footer-col">
          <h4 className="footer-heading">Destek & Yasal</h4>
          <ul className="footer-nav-list">
            <li><RouterLink to="/faq" className="footer-link">Sıkça Sorulan Sorular</RouterLink></li>
            <li><RouterLink to="/privacy" className="footer-link">Gizlilik Politikası</RouterLink></li>
            <li><RouterLink to="/terms" className="footer-link">Kullanım Şartları</RouterLink></li>
            <li>
              <a
                href="https://github.com/Omerfaruk1609/Gilded"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                <GitHubIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} /> Açık Kaynak
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <span>&copy; {new Date().getFullYear()} Gilded (Kintsugi Space) — Tüm Hakları Saklıdır.</span>
          <span className="footer-author">
            Geliştirici:{' '}
            <a
              href="https://github.com/Omerfaruk1609"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link gold-link"
            >
              Ömer Faruk Kara
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer