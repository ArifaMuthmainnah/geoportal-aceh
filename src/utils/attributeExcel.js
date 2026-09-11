import * as XLSX from 'xlsx'

export function downloadAttributeTemplate() {

  const worksheetData = [
    ['name', 'label', 'description'],
    ['contoh_kolom', 'Contoh Label', 'Contoh deskripsi atribut ini'],
  ]

  const worksheet =
    XLSX.utils.aoa_to_sheet(worksheetData)

  worksheet['!cols'] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 40 },
  ]

  const workbook = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Attributes'
  )

  XLSX.writeFile(
    workbook,
    'template-attributes-dataset.xlsx'
  )

}

export async function parseAttributeExcel(file) {

  const data = await file.arrayBuffer()

  const workbook =
    XLSX.read(data, { type: 'array' })

  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    return []
  }

  const sheet = workbook.Sheets[sheetName]

  const rows =
    XLSX.utils.sheet_to_json(sheet, { defval: '' })

  return rows

    .map((row) => {

      const name =
        String(
          row.name ??
          row.Name ??
          row.NAME ??
          ''
        ).trim()

      const label =
        String(
          row.label ??
          row.Label ??
          row.LABEL ??
          ''
        ).trim()

      const description =
        String(
          row.description ??
          row.Description ??
          row.DESCRIPTION ??
          ''
        ).trim()

      return { name, label, description }

    })

    .filter((row) => row.name)

}