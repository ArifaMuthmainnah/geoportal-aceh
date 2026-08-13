function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer">

      <div className="container">

        <div className="footer-main">

          {/* BRAND */}

          <div className="footer-brand">

            <div className="footer-logo">
              ACEH
            </div>

            <div>

              <h2>
                Geoportal Aceh
              </h2>

              <p>
                Portal Informasi Geospasial Aceh
              </p>

            </div>

          </div>


          {/* DESCRIPTION */}

          <div className="footer-description">

            <p>
              Menyediakan akses informasi dan data
              geospasial untuk mendukung pemanfaatan
              informasi geospasial di Aceh.
            </p>

          </div>


          {/* NAVIGATION */}

          <div className="footer-column">

            <h3>
              Navigasi
            </h3>

            <a href="/">
              Beranda
            </a>

            <a href="/katalog">
              Katalog Data
            </a>

            <a href="/webgis">
              WebGIS
            </a>

            <a href="/aplikasi">
              Aplikasi
            </a>

          </div>


          {/* SERVICES */}

          <div className="footer-column">

            <h3>
              Layanan
            </h3>

            <a href="/jign">
              JIGN
            </a>

            <a href="/informasi">
              Informasi
            </a>

            <a href="/webgis">
              Peta Interaktif
            </a>

          </div>

        </div>


        {/* BOTTOM */}

        <div className="footer-bottom">

          <p>
            © {currentYear} Geoportal Aceh.
            Seluruh hak cipta dilindungi.
          </p>

          <div className="footer-bottom-links">

            <span>
              Portal Data Geospasial
            </span>

            <span className="footer-dot">
              •
            </span>

            <span>
              Pemerintah Aceh
            </span>

          </div>

        </div>

      </div>

    </footer>
  )
}

export default Footer