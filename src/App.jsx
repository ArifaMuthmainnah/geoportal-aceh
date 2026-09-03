import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router'


// =====================================================
// COMPONENTS
// =====================================================

import Navbar
  from './components/Navbar'

import Footer
  from './components/Footer'

import BackToTop
  from './components/BackToTop'

import LoginNavbar
  from './components/LoginNavbar'

import ProtectedRoute
  from './components/ProtectedRoute'


// =====================================================
// PUBLIC PAGES
// =====================================================

import Home
  from './pages/Home'

import Katalog
  from './pages/Katalog'

import DatasetDetail
  from './pages/DatasetDetail'

import WebGIS
  from './pages/WebGIS'

import Aplikasi
  from './pages/Aplikasi'

import Peta from './pages/Peta'
import PetaDetail from './pages/PetaDetail'
import Dokumen from './pages/Dokumen'
import DokumenDetail from './pages/DokumenDetail'

import ApplicationDetail
  from './pages/ApplicationDetail'

import JIGN
  from './pages/JIGN'

import JIGNDetail from './pages/JIGNDetail'

import Berita
  from './pages/Berita'

import Agenda
  from './pages/Agenda'

import Pemberitahuan
  from './pages/Pemberitahuan'

import EditMyDataset from './pages/user/EditMyDataset'
import CreateDataset from './pages/user/CreateDataset'
import CreateMap from './pages/user/CreateMap'

import CreateDashboard from './pages/user/CreateDashboard'

// =====================================================
// AUTH
// =====================================================

import {
  AuthProvider,
} from './context/AuthContext'

import Login
  from './pages/login/Login'


// =====================================================
// USER
// =====================================================

import UserDashboard
  from './pages/user/UserDashboard'

import UploadDataset
  from './pages/user/UploadDataset'

import MyDatasets
  from './pages/user/MyDatasets'


// =====================================================
// ADMIN
// =====================================================

import AdminDashboard
  from './pages/admin/AdminDashboard'


// =====================================================
// LOGIN AREA
// =====================================================

import Layers
  from './pages/login/Layers'

import CSRT
  from './pages/login/CSRT'

import Kartografi
  from './pages/login/Kartografi'


// =====================================================
// PUBLIC WRAPPER
// =====================================================

function PublicPage({
  children,
}) {

  return (

    <>

      <Navbar />

      <main>
        {children}
      </main>

      <Footer />

      <BackToTop />

    </>
  )
}


// =====================================================
// LOGIN WRAPPER
// =====================================================

function LoginArea({
  children,
}) {

  return (

    <div className="login-area">

      <LoginNavbar />

      <main>
        {children}
      </main>

    </div>
  )
}


// =====================================================
// APP
// =====================================================

function App() {

  return (

    <BrowserRouter>

      <AuthProvider>

        <Routes>

          {/* =================================================
              LOGIN
          ================================================= */}

          <Route
            path="/login"
            element={

              <LoginArea>

                <Login />

              </LoginArea>
            }
          />


          {/* =================================================
              LOGIN - LAYERS
          ================================================= */}

          <Route
            path="/login/layers"
            element={

              <LoginArea>

                <Layers />

              </LoginArea>
            }
          />


          {/* =================================================
              LOGIN - CSRT
          ================================================= */}

          <Route
            path="/login/csrt"
            element={

              <LoginArea>

                <CSRT />

              </LoginArea>
            }
          />


          {/* =================================================
              LOGIN - KARTOGRAFI
          ================================================= */}

          <Route
            path="/login/kartografi"
            element={

              <LoginArea>

                <Kartografi />

              </LoginArea>
            }
          />


          {/* =================================================
              USER DATASETS
          ================================================= */}

          <Route
            path="/dashboard/datasets"
            element={

              <ProtectedRoute>

                <MyDatasets />

              </ProtectedRoute>
            }
          />


          {/* =================================================
              USER DASHBOARD
          ================================================= */}

          <Route
            path="/dashboard"
            element={

              <ProtectedRoute>

                <UserDashboard />

              </ProtectedRoute>
            }
          />


          {/* =================================================
              UPLOAD
          ================================================= */}

                    <Route
            path="/dashboard/upload"
            element={
              <ProtectedRoute>
                <UploadDataset />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/create-dataset"
            element={
              <ProtectedRoute>
                <CreateDataset />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/create-map"
            element={
              <ProtectedRoute>
                <CreateMap />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/create-dashboard"
            element={
              <ProtectedRoute>
                <CreateDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/edit/:id"
            element={
              <ProtectedRoute>
                <EditMyDataset />
              </ProtectedRoute>
            }
          />


          {/* =================================================
              ADMIN
          ================================================= */}

          <Route
            path="/admin"
            element={

              <ProtectedRoute
                adminOnly
              >

                <AdminDashboard />

              </ProtectedRoute>
            }
          />


          {/* =================================================
              HOME
          ================================================= */}

          <Route
            path="/"
            element={

              <PublicPage>

                <Home />

              </PublicPage>
            }
          />


          {/* =================================================
              KATALOG
          ================================================= */}

          <Route
            path="/katalog"
            element={

              <PublicPage>

                <Katalog />

              </PublicPage>
            }
          />


          <Route
            path="/katalog/:id"
            element={

              <PublicPage>

                <DatasetDetail />

              </PublicPage>
            }
          />


          {/* =================================================
              WEBGIS
          ================================================= */}

          <Route
            path="/webgis"
            element={

              <PublicPage>

                <WebGIS />

              </PublicPage>
            }
          />

          <Route path="/peta" element={<PublicPage><Peta /></PublicPage>} />
          <Route path="/peta/:id" element={<PublicPage><PetaDetail /></PublicPage>} />
          <Route path="/dokumen" element={<PublicPage><Dokumen /></PublicPage>} />
          <Route path="/dokumen/:id" element={<PublicPage><DokumenDetail /></PublicPage>} />


          {/* =================================================
              APLIKASI
          ================================================= */}

          <Route
            path="/aplikasi"
            element={

              <PublicPage>

                <Aplikasi />

              </PublicPage>
            }
          />


          <Route
            path="/aplikasi/:id"
            element={

              <PublicPage>

                <ApplicationDetail />

              </PublicPage>
            }
          />


          {/* =================================================
              JIGN
          ================================================= */}

          <Route
            path="/jign"
            element={

              <PublicPage>

                <JIGN />

              </PublicPage>
            }
          />

          <Route
            path="/jign/:username"
            element={
              <PublicPage>
                <JIGNDetail />
              </PublicPage>
            }
          />


          {/* =================================================
              BERITA
          ================================================= */}

          <Route
            path="/informasi/berita"
            element={

              <PublicPage>

                <Berita />

              </PublicPage>
            }
          />


          {/* =================================================
              AGENDA
          ================================================= */}

          <Route
            path="/informasi/agenda"
            element={

              <PublicPage>

                <Agenda />

              </PublicPage>
            }
          />


          {/* =================================================
              PEMBERITAHUAN
          ================================================= */}

          <Route
            path="/informasi/pemberitahuan"
            element={

              <PublicPage>

                <Pemberitahuan />

              </PublicPage>
            }
          />

        </Routes>

      </AuthProvider>

    </BrowserRouter>
  )
}


export default App