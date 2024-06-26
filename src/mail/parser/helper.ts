import { JSDOM } from 'jsdom'


export function extractTableData (html: string): Record<string, string[]> {
  const dom: JSDOM = new JSDOM(html)
  const tables = dom.window.document.getElementsByTagName('table')
  const result: Record<string, string[]> = {}

  let key: string = ""

  for (let i: number = 0; i < tables.length; i++) {
    const table: HTMLTableElement = tables[i]
    const rows: HTMLCollectionOf<HTMLTableRowElement> = table.rows

    for (let j = 0; j < rows.length; j++) {
      const row: HTMLTableRowElement = rows[j]
      const rowData: string[] = []

      for (let k: number = 1; k < row.cells.length; k++) {
        const cell: HTMLTableCellElement = row.cells[k]
        rowData.push(cell.innerHTML.replace(/(&\w+;)|([\r\n\t]+)/g, '').trim())
      }

      const newKey: string | null = row.cells[0].textContent
      if (newKey != null && newKey.trim() != "") {
        key = newKey.trim()
      }

      if (result[key] == null) {
        result[key] = []
      }
      result[key].push(...rowData)
    }
  }
  return result
}
