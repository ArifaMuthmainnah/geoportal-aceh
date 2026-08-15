import { BrowserRouter, Routes, Route } from 'react-router'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BackToTop from './components/BackToTop'

import Home from './pages/Home'
import Katalog from './pages/Katalog'
import DatasetDetail from './pages/DatasetDetail'
import WebGIS from './pages/WebGIS'
import Aplikasi from './pages/Aplikasi'
import JIGN from './pages/JIGN'
import Berita from './pages/Berita'
import Agenda from './pages/Agenda'
import Pemberitahuan from './pages/Pemberitahuan'

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <main>
        <Routes>

          <Route path="/" element={<Home />} />
          <Route path="/katalog" element={<Katalog />} />
          <Route path="/katalog/:id" element={<DatasetDetail />} />
          <Route path="/webgis" element={<WebGIS />} />
          <Route path="/aplikasi" element={<Aplikasi />} />
          <Route path="/jign" element={<JIGN />} />
          <Route path="/informasi/berita" element={<Berita />} />
          <Route path="/informasi/agenda" element={<Agenda />} />
          <Route
            path="/informasi/pemberitahuan"
            element={<Pemberitahuan />}
          />

        </Routes>
      </main>

      <Footer />
      <BackToTop />

    </BrowserRouter>
  )
}

export default App