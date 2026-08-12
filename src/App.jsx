import { BrowserRouter, Routes, Route } from 'react-router'

import Navbar from './components/Navbar'
import Footer from './components/Footer'

import Home from './pages/Home'
import Katalog from './pages/Katalog'
import WebGIS from './pages/WebGIS'
import Aplikasi from './pages/Aplikasi'
import JIGN from './pages/JIGN'
import Informasi from './pages/Informasi'

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <main>
        <Routes>

          <Route path="/" element={<Home />} />
          <Route path="/katalog" element={<Katalog />} />
          <Route path="/webgis" element={<WebGIS />} />
          <Route path="/aplikasi" element={<Aplikasi />} />
          <Route path="/jign" element={<JIGN />} />
          <Route path="/informasi" element={<Informasi />} />

        </Routes>
      </main>

      <Footer />

    </BrowserRouter>
  )
}

export default App