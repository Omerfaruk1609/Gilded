import React from 'react'
import '../../css/footer.css'

function Footer() {
    return (
        <footer className="footer">

            <div className="footer-content">
                <div className="footer-logo">

                    <h2 className="footer-title">Kintsugi Space</h2>
                </div>
                <div className="footer-team">
                    <h3 className="team-member">Ömer Faruk Kara</h3>
                </div>
                <div className="footer-bottom">
                    &copy; {new Date().getFullYear()} Kintsugi Space - Tüm Hakları Saklıdır.
                </div>
            </div>
        </footer>
    )
}

export default Footer