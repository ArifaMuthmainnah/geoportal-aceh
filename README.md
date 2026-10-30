# Geoportal Aceh

Portal data geospasial resmi Provinsi Aceh — pengembangan versi baru dari Geoportal Aceh, dibangun sebagai bagian dari program magang mahasiswa di **UPTD Statistik, Dinas Komunikasi, Informatika, Persandian, dan Statistik (Diskominsa) Provinsi Aceh**.

## Tentang Proyek

Geoportal Aceh versi baru ini dikembangkan dengan metode **ATM (Amati, Tiru, Modifikasi)**, mengacu pada desain dan alur kerja [Geoportal Kalimantan Selatan](https://geoportal.kalselprov.go.id/), namun disesuaikan dengan kebutuhan data dan kelembagaan Provinsi Aceh.

Sistem ini menggabungkan dua sumber data dalam satu portal:

1. **Data API Legacy** — diambil dari sistem Geoportal Aceh lama ([sig.acehprov.go.id](https://sig.acehprov.go.id/)) yang berbasis GeoNode/GeoServer, diakses melalui proxy adapter tanpa mengubah data asli.
2. **Data Upload Mandiri** — dataset, peta, dan dokumen yang diunggah langsung oleh operator/admin instansi melalui sistem ini, disimpan pada PostgreSQL (Supabase).

Kedua sumber data ditampilkan secara terpadu di katalog, peta interaktif, dan dashboard, dengan mekanisme *role-based access control* (RBAC) dan *override* atribut khusus untuk admin.

## Tim Pengembang

Program Studi Informatika, Fakultas MIPA, Universitas Syiah Kuala — Magang di UPTD Statistik, Diskominsa Provinsi Aceh.

- Arifa Muthmainnah
- Thahira Riska
- Davina Aura

## Fitur Utama

- Katalog dataset, peta (WebGIS), aplikasi, dokumen, berita, dan agenda
- Peta interaktif berbasis Leaflet dengan pencarian wilayah, layer kontrol, dan info fitur
- Upload & manajemen dataset mandiri (shapefile, GeoJSON, dsb.)
- Halaman *View & Edit Data Atribut* khusus admin, dengan strategi penyimpanan terpisah untuk dataset mandiri (langsung ke `metadata.geojson`) dan dataset API legacy (disimpan sebagai *override* lokal tanpa mengubah data GeoServer)
- Dashboard admin & user, manajemen agensi dan pengguna
- Autentikasi & otorisasi berbasis JWT dengan role admin/operator/user

## Teknologi

**Frontend**
- React 19 + Vite
- react-leaflet, Leaflet
- Bootstrap, custom CSS

**Backend**
- Node.js + Express
- PostgreSQL (hosting Supabase)
- JWT (`jsonwebtoken`) untuk autentikasi
- Multer untuk upload file

**Sumber Peta & Geospasial**
- OpenStreetMap & Google Maps tiles
- Nominatim (reverse geocoding)
- GeoServer/GeoNode (API legacy sig.acehprov.go.id)

## Struktur Direktori

```
├── 📁 public
│   ├── 📁 images
│   ├── 🖼️ favicon.svg
│   └── 🖼️ icons.svg
├── 📁 server
│   ├── 📁 config
│   │   └── 📄 database.js
│   ├── 📁 middleware
│   │   └── 📄 authMiddleware.js
│   ├── 📁 routes
│   │   ├── 📄 agencyRoutes.js
│   │   ├── 📄 authRoutes.js
│   │   ├── 📄 datasetRoutes.js
│   │   ├── 📄 externalFetchRoutes.js
│   │   ├── 📄 proxyRoutes.js
│   │   └── 📄 userRoutes.js
│   ├── 📁 scripts
│   │   ├── 📄 migrateSqliteToSupabase.js
│   │   └── 📄 seedAdmin.js
│   ├── 📁 uploads
│   ├── ⚙️ package-lock.json
│   ├── ⚙️ package.json
│   └── 📄 server.js
├── 📁 src
│   ├── 📁 api
│   │   ├── 📄 agencyApi.js
│   │   ├── 📄 apiClient.js
│   │   ├── 📄 attributeDataApi.js
│   │   ├── 📄 authApi.js
│   │   ├── 📄 datasetApi.js
│   │   ├── 📄 documentApi.js
│   │   ├── 📄 externalApi.js
│   │   ├── 📄 geoappApi.js
│   │   ├── 📄 jignApi.js
│   │   ├── 📄 mapApi.js
│   │   ├── 📄 mapLayerApi.js
│   │   ├── 📄 myDatasetApi.js
│   │   ├── 📄 uploadApi.js
│   │   └── 📄 userApi.js
│   ├── 📁 assets
│   │   ├── 🖼️ hero.png
│   │   └── 🖼️ vite.svg
│   ├── 📁 components
│   │   ├── 📄 ActionIcons.jsx
│   │   ├── 📄 AddDatasetLayerModal.jsx
│   │   ├── 📄 AnimatedCounter.jsx
│   │   ├── 📄 ApplicationCard.jsx
│   │   ├── 📄 AttributeDataTable.jsx
│   │   ├── 📄 BackToTop.jsx
│   │   ├── 📄 BackToTopButton.jsx
│   │   ├── 📄 BoundingBoxPicker.jsx
│   │   ├── 📄 CopyLinkButton.jsx
│   │   ├── 📄 CreateChoiceMenu.jsx
│   │   ├── 📄 DatasetCard.jsx
│   │   ├── 📄 Footer.jsx
│   │   ├── 📄 GeoFeatureExplorer.jsx
│   │   ├── 📄 GeoJsonPreviewMap.jsx
│   │   ├── 📄 GeoJsonVertexEditor.jsx
│   │   ├── 📄 HomeDocumentsSection.jsx
│   │   ├── 📄 HomeMapsSection.jsx
│   │   ├── 📄 LocationBoundsMap.jsx
│   │   ├── 📄 LoginNavbar.jsx
│   │   ├── 📄 Navbar.jsx
│   │   ├── 📄 OwnerBadge.jsx
│   │   └── 📄 ProtectedRoute.jsx
│   ├── 📁 context
│   │   └── 📄 AuthContext.jsx
│   ├── 📁 map
│   │   ├── 📄 AddLayerModal.jsx
│   │   ├── 📄 FeatureInfoPanel.jsx
│   │   ├── 📄 LayerPanel.jsx
│   │   ├── 📄 MapControls.jsx
│   │   ├── 📄 MapView.jsx
│   │   ├── 📄 MouseCoordinate.jsx
│   │   ├── 📄 RemoveLayerModal.jsx
│   │   ├── 📄 SearchPanel.jsx
│   │   └── 📄 VillageSearchModal.jsx
│   ├── 📁 pages
│   │   ├── 📁 admin
│   │   │   ├── 📄 AdminDashboard.jsx
│   │   │   └── 📄 EditDatasetAdmin.jsx
│   │   ├── 📁 login
│   │   │   ├── 📄 CSRT.jsx
│   │   │   ├── 📄 Kartografi.jsx
│   │   │   ├── 📄 Layers.jsx
│   │   │   └── 📄 Login.jsx
│   │   ├── 📁 user
│   │   │   ├── 📄 AmbilApi.jsx
│   │   │   ├── 📄 CreateDashboard.jsx
│   │   │   ├── 📄 CreateDataset.jsx
│   │   │   ├── 📄 CreateMap.jsx
│   │   │   ├── 📄 EditMyDataset.jsx
│   │   │   ├── 📄 MyDatasets.jsx
│   │   │   ├── 📄 Profil.jsx
│   │   │   ├── 📄 UploadDataset.jsx
│   │   │   └── 📄 UserDashboard.jsx
│   │   ├── 📄 Agenda.jsx
│   │   ├── 📄 Aplikasi.jsx
│   │   ├── 📄 ApplicationDetail.jsx
│   │   ├── 📄 Berita.jsx
│   │   ├── 📄 BeritaDetail.jsx
│   │   ├── 📄 DatasetDetail.jsx
│   │   ├── 📄 Dokumen.jsx
│   │   ├── 📄 DokumenDetail.jsx
│   │   ├── 📄 Home.jsx
│   │   ├── 📄 JIGN.jsx
│   │   ├── 📄 JIGNDetail.jsx
│   │   ├── 📄 Katalog.jsx
│   │   ├── 📄 Pemberitahuan.jsx
│   │   ├── 📄 PemberitahuanDetail.jsx
│   │   ├── 📄 Peta.jsx
│   │   ├── 📄 PetaDetail.jsx
│   │   └── 📄 WebGIS.jsx
│   ├── 📁 utils
│   │   ├── 📄 attributeExcel.js
│   │   ├── 📄 datasetUtils.js
│   │   ├── 📄 externalApiMapper.js
│   │   ├── 📄 geojsonVertexEditor.js
│   │   ├── 📄 ownDataAdapter.js
│   │   ├── 📄 resourceFields.js
│   │   ├── 📄 shapefileFields.js
│   │   └── 📄 urlValidation.js
│   ├── 📄 App.jsx
│   ├── 🎨 index.css
│   └── 📄 main.jsx
├── ⚙️ .gitignore
├── ⚙️ .oxlintrc.json
├── 📝 README.md
├── 🌐 index.html
├── ⚙️ package-lock.json
├── ⚙️ package.json
└── 📄 vite.config.js
```


## Instalasi & Menjalankan

### Prasyarat

- Node.js (disarankan versi LTS terbaru)
- npm
- Akun & project [Supabase](https://supabase.com/) (PostgreSQL)

### 1. Clone repository

```bash
git clone https://github.com/ArifaMuthmainnah/geoportal-aceh.git
cd geoportal-aceh
```

### 2. Install dependencies

```bash
# Frontend (dari root project)
npm install

# Backend
cd server
npm install
cd ..
```

### 3. Konfigurasi environment variables

Buat file `.env` di root project (mengacu pada `.env.example`):

VITE_API_BASE_URL=
VITE_AUTH_API_URL=

Buat file `server/.env` (mengacu pada `server/.env.example`):

PORT=
JWT_SECRET=
ADMIN_USERNAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
SUPABASE_DATABASE_URL=
OLD_API_BASE_URL=


### 4. Jalankan backend

```bash
cd server
npm run dev
```

### 5. Jalankan frontend

```bash
# di terminal terpisah, dari root project
npm run dev
```

Frontend akan berjalan di `http://localhost:5173` (default Vite) dan backend sesuai `PORT` yang dikonfigurasi.

### 6. Buat akun admin pertama

Setelah backend berhasil jalan (sekali saja, tidak perlu diulang setiap start):

\`\`\`bash
cd server
npm run seed
\`\`\`

Ini akan membuat akun admin sesuai `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` yang sudah diisi di `server/.env`.

## Alur Kerja Git

Setiap anggota tim disarankan bekerja di branch masing-masing sebelum digabungkan ke `main`, contoh:

```bash
git checkout -b nama-anggota/nama-fitur
```

## Catatan

Proyek ini merupakan bagian dari kegiatan magang mahasiswa dan turut didokumentasikan dalam artikel ilmiah menggunakan format **J-SIGN (Jurnal Sistem Informasi), Universitas Syiah Kuala** dan diajukan ke website kantor.
