// =====================================================
// BACA NAMA FIELD DARI FILE .DBF (SHAPEFILE)
// =====================================================
//
// Format header DBF (dBASE):
// - byte 0        : versi
// - byte 4-7      : jumlah record (uint32 LE)
// - byte 8-9      : ukuran header (uint16 LE)
// - byte 10-11    : ukuran per record (uint16 LE)
// - byte 32+      : deskriptor field, masing-masing 32 byte:
//                   - byte 0-10 : nama field (ASCII, diakhiri \0)
//                   - byte 11   : tipe field (C/N/D/L/F, dst)
//                 diakhiri byte penanda 0x0D
//
// Fungsi ini HANYA menarik NAMA kolom (field name). Label
// dan deskripsi tetap harus diisi manual oleh user, karena
// shapefile memang tidak menyimpan informasi itu.
//
// =====================================================

export async function extractDbfFieldNames(file) {

  const buffer = await file.arrayBuffer()
  const view = new DataView(buffer)

  if (buffer.byteLength < 32) {
    return []
  }

  const headerSize = view.getUint16(8, true)

  const decoder = new TextDecoder('ascii')

  const fields = []

  let offset = 32

  while (offset + 32 <= headerSize) {

    const byte = view.getUint8(offset)

    // 0x0D menandai akhir deskriptor field
    if (byte === 0x0d) {
      break
    }

    const nameBytes = new Uint8Array(buffer, offset, 11)

    const rawName = decoder.decode(nameBytes)

    const name = rawName.replace(/\0.*$/, '').trim()

    if (name) {
      fields.push(name)
    }

    offset += 32

  }

  return fields

}


// =====================================================
// CARI FILE .DBF DI DALAM DAFTAR FILE YANG DIPILIH
// =====================================================

export function findDbfFile(files) {

  if (!Array.isArray(files)) {
    return null
  }

  return (
    files.find((file) =>
      file.name.toLowerCase().endsWith('.dbf')
    ) || null
  )

}