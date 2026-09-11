import React, { useEffect, useState } from 'react'
import { getAllDatasets } from '../api/datasetApi'
import shp from 'shpjs'

function AddLayerModal({
  onClose,
  onAdd,
  onAddFile
}) {
  const [activeTab, setActiveTab] = useState('DATASET') 
  const [datasets, setDatasets] = useState([])
  const [selected, setSelected] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [serverCategory, setServerCategory] = useState('')
  const [selectedServer, setSelectedServer] = useState('')
  const [simpulKeyword, setSimpulKeyword] = useState('')
  const [showSimpulWarning, setShowSimpulWarning] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [fileError, setFileError] = useState('')
  const [processingFile, setProcessingFile] = useState(false)
  const [urlServerCat, setUrlServerCat] = useState('')
  const [urlSelectedServer, setUrlSelectedServer] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [urlType, setUrlType] = useState('Geoserver (OGC)')
  const [urlResults, setUrlResults] = useState([]) // Untuk menampung hasil metadata dummy
  const [urlError, setUrlError] = useState('')
  const simpulData = {
    'Kementerian/Lembaga': ['Badan Informasi Geospasial', 'Kementerian Dalam Negeri', 'BNPB', 'LAPAN'],
    'Pemerintah Provinsi': ['Provinsi Aceh', 'Provinsi Sumatera Utara', 'Provinsi DKI Jakarta'],
    'Pemerintah Kabupaten/Kota': ['Kota Banda Aceh', 'Kabupaten Aceh Besar', 'Kota Sabang', 'Kabupaten Pidie']
  }

  const urlServerMapping = {
    'Kementerian/Lembaga': [
      { name: 'Lembaga Penerbangan dan Antariksa Nasional [FAIL]', url: 'http://spacemap.lapan.go.id/erdas-apollo/catalog/csw?version=2.0' },
      { name: 'Badan Informasi Geospasial [OK]', url: 'https://tanahair.indonesia.go.id/geoserver' }
    ],
    'Pemerintah Provinsi': [
      { name: 'Provinsi Aceh [OK]', url: 'https://sig.acehprov.go.id/catalogue/csw' },
      { name: 'Provinsi Kalimantan Selatan [OK]', url: 'https://geoportal.kalselprov.go.id/geoserver' }
    ],
    'Pemerintah Kabupaten/Kota': [
      { name: 'Kota Banda Aceh [OK]', url: 'https://geoportal.bandaacehkota.go.id/geoserver' }
    ]
  };

  useEffect(() => {
    let cancelled = false
    async function loadDatasets() {
      try {
        setLoading(true)
        const data = await getAllDatasets()
        if (!cancelled) setDatasets(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!cancelled) setError('Gagal memuat dataset.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadDatasets()
    return () => { cancelled = true }
  }, [])

  const handleSimpulSearch = () => {
    if (simpulKeyword) setShowSimpulWarning(true)
  }

  const handleFileChange = (e) => {

    const files = Array.from(
      e.target.files || []
    )
  
    setFileError('')
  
    if (files.length === 0) {
      setSelectedFiles([])
      return
    }
  
    const allowedExtensions = [
      '.shp',
      '.shx',
      '.dbf',
      '.prj'
    ]
  
    const invalidFiles = files.filter(
      file =>
        !allowedExtensions.some(
          ext =>
            file.name
              .toLowerCase()
              .endsWith(ext)
        )
    )
  
    if (invalidFiles.length > 0) {
  
      setFileError(
        'File hanya boleh berupa .shp, .shx, .dbf, dan .prj.'
      )
  
      setSelectedFiles([])
  
      return
    }
  
    setSelectedFiles(files)
  }

  const validateShapefileSet = () => {

    const shpFile = selectedFiles.find(
      file =>
        file.name
          .toLowerCase()
          .endsWith('.shp')
    )
  
    const shxFile = selectedFiles.find(
      file =>
        file.name
          .toLowerCase()
          .endsWith('.shx')
    )
  
    const dbfFile = selectedFiles.find(
      file =>
        file.name
          .toLowerCase()
          .endsWith('.dbf')
    )
  
    if (
      !shpFile ||
      !shxFile ||
      !dbfFile
    ) {
  
      setFileError(
        'Shapefile minimal harus terdiri dari file .shp, .shx, dan .dbf.'
      )
  
      return false
    }
  
    const getBaseName = (filename) =>
      filename
        .replace(/\.(shp|shx|dbf|prj)$/i, '')
        .toLowerCase()
  
    const baseNames = [
      shpFile,
      shxFile,
      dbfFile
    ].map(
      file => getBaseName(file.name)
    )
  
    if (
      !baseNames.every(
        name => name === baseNames[0]
      )
    ) {
  
      setFileError(
        'File .shp, .shx, dan .dbf harus memiliki nama dasar yang sama.'
      )
  
      return false
    }
  
    return true
  }

  const handleAddFile = async () => {

    if (!validateShapefileSet()) {
      return
    }
  
    try {
  
      setProcessingFile(true)
      setFileError('')
  
      const shpFile =
        selectedFiles.find(
          file =>
            file.name
              .toLowerCase()
              .endsWith('.shp')
        )
  
      const dbfFile =
        selectedFiles.find(
          file =>
            file.name
              .toLowerCase()
              .endsWith('.dbf')
        )
  
      const prjFile =
        selectedFiles.find(
          file =>
            file.name
              .toLowerCase()
              .endsWith('.prj')
        )
  
      const shpBuffer =
        await shpFile.arrayBuffer()
  
      const dbfBuffer =
        await dbfFile.arrayBuffer()
  
      let prjText = null
  
      if (prjFile) {
        prjText =
          await prjFile.text()
      }
  
      const geojson =
        await shp({
          shp: shpBuffer,
          dbf: dbfBuffer,
          prj: prjText || undefined
        })
  
      if (!geojson) {
  
        throw new Error(
          'GeoJSON tidak berhasil dibuat.'
        )
  
      }

      const layerName =
        shpFile.name.replace(
          /\.shp$/i,
          ''
        )
  
      const fileLayer = {
  
        id:
          `file-${Date.now()}`,
  
        name:
          layerName,
  
        source:
          'file',
  
        visible:
          true,
  
        geojson,
  
        featureInfoTemplate:
          null,
  
      }

      onAddFile(fileLayer)  
      onClose()
  
    } catch (error) {
  
      console.error(
        'Gagal membaca Shapefile:',
        error
      )
  
      setFileError(
        'Shapefile gagal dibaca. Pastikan file .shp, .shx, .dbf dan proyeksinya benar.'
      )
  
    } finally {
      setProcessingFile(false)
    }
  
  }

  const handleGetUrlData = () => {
    setUrlError('');
    setUrlResults([]);

    if (urlSelectedServer.includes('[FAIL]')) {
      setUrlError('Gagal memuat data, time out!'); // ATM Gambar 8
    } else if (urlSelectedServer.includes('[OK]')) {

      setUrlResults([
        {
          id: 1,
          title: "Peta Jumlah Desa yang sudah menggunakan pelayanan administrasi Pemerintahan secara digital melalui SIGAP",
          update: "2026-08-08T08:00:00Z",
          instansi: "DPMG Aceh"
        }
      ]);
    }
  }

  const getID = (item) => (item?.id || item?.pk || null);
  const getInstitution = (dataset) => {
    const owner = dataset?.owner;
    if (!owner) return '-';
    return `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || owner.username || '-';
  };

  const getCategory = (dataset) => {
    const category = dataset?.category;
    if (!category) return '-';
    return category.gn_description || category.description || category.identifier || '-';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="aceh-modal dark-theme large" onClick={(e) => e.stopPropagation()}>
        
        <div className="aceh-modal-header">
          <span>Tambahkan Peta</span>
          <button onClick={onClose} className="close-btn-x">✖</button>
        </div>

        <div className="modal-tabs">
          <button className={`tab ${activeTab === 'DATASET' ? 'active' : ''}`} onClick={() => setActiveTab('DATASET')}>DATASET</button>
          <button className={`tab ${activeTab === 'SIMPUL' ? 'active' : ''}`} onClick={() => setActiveTab('SIMPUL')}>SIMPUL</button>
          <button className={`tab ${activeTab === 'FILE' ? 'active' : ''}`} onClick={() => setActiveTab('FILE')}>FILE</button>
          <button className={`tab ${activeTab === 'URL' ? 'active' : ''}`} onClick={() => setActiveTab('URL')}>URL</button>
        </div>

        <div className="modal-body">
          
          {activeTab === 'DATASET' && (
            <>
              <div className="search-box-container">
                <input type="text" placeholder="Cari Peta Dataset..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <button className="btn-search">Cari</button>
              </div>
              <div className="dataset-list">
                {loading ? <p className="loading-text">Memuat dataset...</p> : 
                  datasets.filter(d => (d.title || d.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((dataset) => (
                    <div
                      key={getID(dataset)}
                      className={`dataset-card ${getID(selected) === getID(dataset) ? 'selected' : ''}`}
                      onClick={() => setSelected(dataset)}
                    >
                      <div className="dataset-icon">🗺️</div>
                      <div className="dataset-info">
                        <h6>[{getID(dataset)}] {dataset.title || dataset.name}</h6>
                        <p>Instansi : {getInstitution(dataset)}</p>
                        <p>Kategori : {getCategory(dataset)}</p>
                      </div>
                    </div>
                  ))
                }
              </div>
              <div className="selected-label">
                Selected Layer: <span className="highlight">{selected ? (selected.title || selected.name) : '-'}</span>
              </div>
            </>
          )}

          {activeTab === 'SIMPUL' && (
            <div className="simpul-container">
              <div className="form-group-simpul">
                <label>Server Kategori :</label>
                <select value={serverCategory} onChange={(e) => { setServerCategory(e.target.value); setSelectedServer(''); }}>
                  <option value="">--- Pilih Server Kategori ---</option>
                  {Object.keys(simpulData).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="form-group-simpul">
                <label>Pilih Server :</label>
                <select value={selectedServer} onChange={(e) => setSelectedServer(e.target.value)} disabled={!serverCategory}>
                  <option value="">--- Semua Server ---</option>
                  {serverCategory && simpulData[serverCategory].map(srv => <option key={srv} value={srv}>{srv}</option>)}
                </select>
              </div>
              <div className="form-group-simpul">
                <label>Kata Kunci :</label>
                <div className="input-with-btn">
                  <input type="text" placeholder="peta" value={simpulKeyword} onChange={(e) => setSimpulKeyword(e.target.value)} />
                  <button className="btn-search-simpul" onClick={handleSimpulSearch}>Cari</button>
                </div>
              </div>
              {showSimpulWarning && <div className="warning-box-simpul">Tidak dapat terhubung dengan Server!</div>}
              <div className="simpul-result-placeholder"></div>
            </div>
          )}

{activeTab === 'FILE' && (

<div className="file-upload-container">

  <div className="notice-box-file">

    <strong>Perhatikan.</strong>

    <p>
      Shapefile minimal terdiri dari set
      (.shp .shx .dbf);
      file .prj disarankan;
      tidak memiliki dimensi Z;
      proyeksi EPSG:4326.
    </p>

  </div>


  <div className="file-input-wrapper">

    <input
      type="text"
      className="file-path-display"
      placeholder="Choose shapefile..."
      value={
        selectedFiles.length > 0
          ? `${selectedFiles.length} file dipilih`
          : ''
      }
      readOnly
    />

    <label className="btn-browse">

      Browse

      <input
        type="file"
        multiple
        accept=".shp,.shx,.dbf,.prj"
        onChange={handleFileChange}
        style={{
          display: 'none'
        }}
      />

    </label>

  </div>

  {selectedFiles.length > 0 && (

    <div className="selected-files-list">

      {selectedFiles.map(
        (file, index) => (

          <div
            className="file-info-selected"
            key={`${file.name}-${index}`}
          >

            <span>
              📄 {file.name}
            </span>

            <small>
              {(file.size / 1024)
                .toFixed(2)} KB
            </small>

          </div>

        )
      )}

    </div>

  )}

  {fileError && (

    <div className="file-error-message">

      {fileError}

    </div>

  )}

</div>

)}

          {activeTab === 'URL' && (
            <div className="url-tab-container">
              <div className="form-group-url">
                <label>Server Kategori:</label>
                <select value={urlServerCat} onChange={(e) => { setUrlServerCat(e.target.value); setUrlSelectedServer(''); setUrlInput(''); }}>
                  <option value="">--- Pilih Server ---</option>
                  {Object.keys(urlServerMapping).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="form-group-url">
                <label>Pilih Server :</label>
                <select 
                  value={urlSelectedServer} 
                  onChange={(e) => {
                    setUrlSelectedServer(e.target.value);
                    const found = urlServerMapping[urlServerCat].find(s => s.name === e.target.value);
                    setUrlInput(found ? found.url : '');
                  }}
                  disabled={!urlServerCat}
                >
                  <option value="">---Simpul Jaringan Informasi Geospasial---</option>
                  {urlServerCat && urlServerMapping[urlServerCat].map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                </select>
              </div>

              <div className="form-group-url">
                <label>Url :</label>
                <input type="text" className="url-display-input" value={urlInput} readOnly placeholder="Map Server Rest API url" />
              </div>

              <div className="form-group-url type-row">
                <label>Type:</label>
                <div className="type-action-group">
                  <select value={urlType} onChange={(e) => setUrlType(e.target.value)}>
                    <option>Geoserver (OGC)</option>
                    <option>Esri Rest (MapServer)</option>
                    <option>Geoportal Palapa (json)</option>
                    <option>Katalog Service for the Web (CSW)</option>
                  </select>
                  <button className="btn-get-data" onClick={handleGetUrlData}>GET DATA</button>
                </div>
              </div>

              {urlError && <div className="url-error-box">{urlError}</div>}

              <div className="url-results-list">
                {urlResults.map(res => (
                  <div key={res.id} className="metadata-card">
                    <div className="metadata-thumb">Not found image thumbnail</div>
                    <div className="metadata-content">
                      <h6>[{res.id}] {res.title}</h6>
                      <p>Update : {res.update}</p>
                      <div className="metadata-links">
                        <span className="badge-link">LINK</span>
                        <span className="badge-link">WMS</span>
                        <span className="badge-link">WFS</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="modal-footer">
          <button className="btn-close-modal" onClick={onClose}>✖ Close</button>
          <button
  className="btn-add-modal"

  disabled={
    activeTab === 'DATASET'
      ? !selected
      : activeTab === 'FILE'
        ? selectedFiles.length === 0 ||
          processingFile
        : true
  }

  onClick={() => {

    if (
      activeTab === 'DATASET' &&
      selected
    ) {

      onAdd(selected)

    }

    else if (
      activeTab === 'FILE'
    ) {

      handleAddFile()

    }

  }}
>

  {processingFile
    ? 'Memproses...'
    : '➕ Add'
  }

</button>
        </div>
      </div>
    </div>
  )
}

export default AddLayerModal