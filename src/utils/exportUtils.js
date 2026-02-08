import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
// Import autotable function explicitly (ESM-friendly)
import autoTable from 'jspdf-autotable'

/**
 * Format date for display
 */
const formatDateForExport = (dateString) => {
  const date = new Date(dateString)
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayName = days[date.getDay()]
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return { dayName, date: `${day}.${month}.${year}`, fullDate: date }
}

/**
 * Format currency for display
 */
const formatCurrencyForExport = (amount) => {
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}


/**
 * Export Daily Cash Memo to PDF
 * Uses a single autoTable with side-by-side columns (ledger-style)
 */
export const exportToPDF = (memo, selectedDate, previousBalance) => {
  const creditEntries = memo?.creditEntries || []
  const debitEntries = memo?.debitEntries || []

  console.log('PDF Export - Credit Entries:', creditEntries)
  console.log('PDF Export - Debit Entries:', debitEntries)

  const { dayName, date: dateStr } = formatDateForExport(selectedDate)
  const doc = new jsPDF('p', 'mm', 'a4')

  // Ensure autotable is available (ESM import)
  if (!autoTable) {
    console.error('jspdf-autotable plugin not loaded')
    alert('PDF export plugin not available. Please refresh the page.')
    return
  }

  // ===== HEADER =====
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Daily Cash Memo', 105, 15, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Date: ${dateStr}`, 14, 25)
  doc.text(`Day: ${dayName}`, 14, 32)

  // ===== PREPARE CREDIT DATA =====
  const creditRows = []
  
  // Previous balance row
  creditRows.push([
    { content: 'Previous Balance', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
    { content: '', styles: { fillColor: [240, 240, 240] } },
    { content: formatCurrencyForExport(previousBalance || 0), styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 240, 240] } }
  ])

  // Credit entries
  creditEntries.forEach(entry => {
    creditRows.push([
      entry.name || '',
      entry.description || '',
      entry.amount ? formatCurrencyForExport(entry.amount) : ''
    ])
  })

  // Credit total
  const totalCredit = previousBalance + creditEntries.reduce((sum, e) => sum + (e.amount || 0), 0)
  creditRows.push([
    { content: 'Total', styles: { fontStyle: 'bold' } },
    { content: '', styles: { fontStyle: 'bold' } },
    { content: formatCurrencyForExport(totalCredit), styles: { fontStyle: 'bold', halign: 'right' } }
  ])

  // ===== PREPARE DEBIT DATA =====
  const debitRows = []
  
  // Debit entries
  debitEntries.forEach(entry => {
    debitRows.push([
      entry.name || '',
      entry.description || '',
      entry.amount ? formatCurrencyForExport(entry.amount) : ''
    ])
  })

  // Debit total
  const totalDebit = debitEntries.reduce((sum, e) => sum + (e.amount || 0), 0)
  debitRows.push([
    { content: 'Total', styles: { fontStyle: 'bold' } },
    { content: '', styles: { fontStyle: 'bold' } },
    { content: formatCurrencyForExport(totalDebit), styles: { fontStyle: 'bold', halign: 'right' } }
  ])

  // Closing balance
  const closingBalance = totalCredit - totalDebit
  debitRows.push([
    { content: 'Closing Balance', styles: { fontStyle: 'bold' } },
    { content: '', styles: { fontStyle: 'bold' } },
    { content: formatCurrencyForExport(closingBalance), styles: { fontStyle: 'bold', halign: 'right' } }
  ])

  console.log('Credit rows:', creditRows)
  console.log('Debit rows:', debitRows)

  // ===== CREDIT TABLE =====
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('CREDIT (Cash In)', 14, 40)
  
  autoTable(doc, {
    startY: 45,
    margin: { left: 14, right: 110 },
    head: [['Name', 'Description', 'Amount']],
    body: creditRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.2,
      cellPadding: 1.8,
      valign: 'middle',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 35, halign: 'left' },
      1: { cellWidth: 40, halign: 'left' },
      2: { cellWidth: 20, halign: 'right' }
    }
  })

  // ===== DEBIT TABLE =====
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('DEBIT (Cash Out)', 110, 40)
  
  autoTable(doc, {
    startY: 45,
    margin: { left: 110, right: 14 },
    head: [['Name', 'Description', 'Amount']],
    body: debitRows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.2,
      cellPadding: 1.8,
      valign: 'middle',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 35, halign: 'left' },
      1: { cellWidth: 40, halign: 'left' },
      2: { cellWidth: 20, halign: 'right' }
    }
  })

  console.log('PDF created successfully')

  // Save PDF
  const fileName = `Daily_Cash_Memo_${dateStr.replace(/\./g, '_')}.pdf`
  doc.save(fileName)
}

/**
 * Export Daily Cash Memo to Excel
 */
export const exportToExcel = (memo, selectedDate, previousBalance) => {
  // Allow export even if memo doesn't exist yet (will show empty entries)
  const creditEntries = memo?.creditEntries || []
  const debitEntries = memo?.debitEntries || []

  const { dayName, date: dateStr } = formatDateForExport(selectedDate)
  
  // Create a new workbook
  const wb = XLSX.utils.book_new()
  
  // CREDIT Sheet
  const creditData = [
    ['Daily Cash Memo'],
    ['Date', dateStr],
    ['Day', dayName],
    [],
    ['CREDIT (Cash In)'],
    ['Name', 'Description', 'Amount']
  ]
  
  // Previous Balance
  creditData.push(['Previous Blnc', '', previousBalance || 0])
  
  // Credit entries
  if (creditEntries.length > 0) {
    creditEntries.forEach(entry => {
      creditData.push([
        entry.name,
        entry.description || '',
        entry.amount || 0
      ])
    })
  }
  
  // Total Credit
  const totalCredit = previousBalance + creditEntries.reduce((sum, e) => sum + (e.amount || 0), 0)
  creditData.push(['Total', '', totalCredit])
  
  const creditWs = XLSX.utils.aoa_to_sheet(creditData)
  
  // Set column widths
  creditWs['!cols'] = [
    { wch: 25 }, // Name
    { wch: 30 }, // Description
    { wch: 15 }  // Amount
  ]
  
  XLSX.utils.book_append_sheet(wb, creditWs, 'Credit')
  
  // DEBIT Sheet
  const debitData = [
    ['Daily Cash Memo'],
    ['Date', dateStr],
    ['Day', dayName],
    [],
    ['DEBIT (Cash Out)'],
    ['Name', 'Description', 'Amount']
  ]
  
  // Previous Balance (empty for debit)
  debitData.push(['Previous Blnc', '', ''])
  
  // Debit entries
  if (debitEntries.length > 0) {
    debitEntries.forEach(entry => {
      debitData.push([
        entry.name,
        entry.description || '',
        entry.amount || 0
      ])
    })
  }
  
  // Total Debit
  const totalDebit = debitEntries.reduce((sum, e) => sum + (e.amount || 0), 0)
  debitData.push(['Total', '', totalDebit])
  
  const debitWs = XLSX.utils.aoa_to_sheet(debitData)
  
  // Set column widths
  debitWs['!cols'] = [
    { wch: 25 }, // Name
    { wch: 30 }, // Description
    { wch: 15 }  // Amount
  ]
  
  XLSX.utils.book_append_sheet(wb, debitWs, 'Debit')
  
  // Combined Sheet - Side by Side Layout
  const combinedData = [
    ['Daily Cash Memo', '', '', '', '', 'Daily Cash Memo'],
    ['Date', dateStr, '', '', '', 'Date', dateStr],
    ['Day', dayName, '', '', '', 'Day', dayName],
    [],
    ['CREDIT (Cash In)', '', '', '', '', 'DEBIT (Cash Out)', '', ''],
    ['Name', 'Description', 'Amount', '', '', 'Name', 'Description', 'Amount']
  ]
  
  // Prepare credit and debit rows for side-by-side layout
  const creditRows = []
  creditRows.push(['Previous Blnc', '', previousBalance || 0])
  if (creditEntries.length > 0) {
    creditEntries.forEach(entry => {
      creditRows.push([
        entry.name,
        entry.description || '',
        entry.amount || 0
      ])
    })
  }
  creditRows.push(['Total', '', totalCredit])
  
  const debitRows = []
  debitRows.push(['Previous Blnc', '', ''])
  if (debitEntries.length > 0) {
    debitEntries.forEach(entry => {
      debitRows.push([
        entry.name,
        entry.description || '',
        entry.amount || 0
      ])
    })
  }
  debitRows.push(['Total', '', totalDebit])
  
  // Combine credit and debit rows side by side
  const maxRows = Math.max(creditRows.length, debitRows.length)
  for (let i = 0; i < maxRows; i++) {
    const creditRow = creditRows[i] || ['', '', '']
    const debitRow = debitRows[i] || ['', '', '']
    combinedData.push([
      creditRow[0] || '', // Credit Name
      creditRow[1] || '', // Credit Description
      creditRow[2] !== undefined ? creditRow[2] : '', // Credit Amount
      '', '', // Empty columns for spacing
      debitRow[0] || '', // Debit Name
      debitRow[1] || '', // Debit Description
      debitRow[2] !== undefined ? debitRow[2] : ''  // Debit Amount
    ])
  }
  
  combinedData.push([])
  combinedData.push(['Closing Balance', '', totalCredit - totalDebit, '', '', '', '', ''])
  
  const combinedWs = XLSX.utils.aoa_to_sheet(combinedData)
  combinedWs['!cols'] = [
    { wch: 25 }, // Credit Name
    { wch: 30 }, // Credit Description
    { wch: 15 }, // Credit Amount
    { wch: 5 },  // Spacing
    { wch: 5 },  // Spacing
    { wch: 25 }, // Debit Name
    { wch: 30 }, // Debit Description
    { wch: 15 }  // Debit Amount
  ]
  
  XLSX.utils.book_append_sheet(wb, combinedWs, 'Combined')
  
  // Save Excel file
  const fileName = `Daily_Cash_Memo_${dateStr.replace(/\./g, '_')}.xlsx`
  XLSX.writeFile(wb, fileName)
}

/**
 * Export Transaction History to PDF
 */
export const exportTransactionHistoryToPDF = (transactions, entityName, entityType, filters = {}) => {
  const doc = new jsPDF('p', 'mm', 'a4')

  // Ensure autotable is available (ESM import)
  if (!autoTable) {
    console.error('jspdf-autotable plugin not loaded')
    alert('PDF export plugin not available. Please refresh the page.')
    return
  }

  // ===== HEADER =====
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(`${entityType === 'customer' ? 'Customer' : 'Supplier'} Transaction History`, 105, 15, { align: 'center' })

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`${entityType === 'customer' ? 'Customer' : 'Supplier'}: ${entityName}`, 105, 25, { align: 'center' })

  // Filter information
  if (filters.startDate || filters.endDate) {
    doc.setFontSize(10)
    let filterText = 'Period: '
    if (filters.startDate) filterText += formatDateForExport(filters.startDate).date
    if (filters.startDate && filters.endDate) filterText += ' to '
    if (filters.endDate) filterText += formatDateForExport(filters.endDate).date
    doc.text(filterText, 105, 32, { align: 'center' })
  }

  // ===== PREPARE DATA =====
  const tableData = transactions.map(transaction => [
    formatDateForExport(transaction.date || transaction.createdAt).date,
    transaction.type || 'N/A',
    transaction.description || 'No description',
    transaction.source || 'Manual Entry',
    transaction.paymentMethod || 'N/A',
    formatCurrencyForExport(transaction.amount || 0)
  ])

  // Calculate totals
  const totalCredit = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const totalDebit = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const balance = entityType === 'customer' 
    ? totalCredit - totalDebit 
    : totalDebit - totalCredit

  // Add summary rows
  tableData.push([
    { content: 'TOTAL CREDIT', styles: { fontStyle: 'bold', fillColor: [240, 255, 240] } },
    '',
    '',
    '',
    '',
    { content: formatCurrencyForExport(totalCredit), styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 255, 240] } }
  ])
  
  tableData.push([
    { content: 'TOTAL DEBIT', styles: { fontStyle: 'bold', fillColor: [255, 240, 240] } },
    '',
    '',
    '',
    '',
    { content: formatCurrencyForExport(totalDebit), styles: { fontStyle: 'bold', halign: 'right', fillColor: [255, 240, 240] } }
  ])
  
  tableData.push([
    { content: 'NET BALANCE', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
    '',
    '',
    '',
    '',
    { content: formatCurrencyForExport(balance), styles: { fontStyle: 'bold', halign: 'right', fillColor: [240, 240, 240] } }
  ])

  // ===== TABLE =====
  autoTable(doc, {
    startY: 40,
    head: [['Date', 'Type', 'Description', 'Source', 'Payment Method', 'Amount']],
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2,
      valign: 'middle',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'left' },  // Date
      1: { cellWidth: 20, halign: 'center' }, // Type
      2: { cellWidth: 50, halign: 'left' },  // Description
      3: { cellWidth: 25, halign: 'left' },  // Source
      4: { cellWidth: 25, halign: 'left' },  // Payment Method
      5: { cellWidth: 30, halign: 'right' }  // Amount
    }
  })

  // Save PDF
  const fileName = `${entityType}_Transaction_History_${entityName.replace(/\s+/g, '_')}_${formatDateForExport(new Date()).date}.pdf`
  doc.save(fileName)
}

/**
 * Export Transaction History to Excel
 */
export const exportTransactionHistoryToExcel = (transactions, entityName, entityType, filters = {}) => {
  const wb = XLSX.utils.book_new()
  
  // Main transaction data
  const transactionData = [
    [`${entityType === 'customer' ? 'Customer' : 'Supplier'} Transaction History`],
    [`${entityType === 'customer' ? 'Customer' : 'Supplier'}: ${entityName}`],
    [],
    ['Filter Information']
  ]
  
  // Add filter info if any
  if (filters.startDate || filters.endDate) {
    transactionData.push(['Period:', filters.startDate ? formatDateForExport(filters.startDate).date : 'Start', 
                         'to:', filters.endDate ? formatDateForExport(filters.endDate).date : 'End'])
  }
  if (filters.transactionType) {
    transactionData.push(['Transaction Type:', filters.transactionType])
  }
  if (filters.source) {
    transactionData.push(['Source:', filters.source])
  }
  if (filters.minAmount || filters.maxAmount) {
    transactionData.push(['Amount Range:', filters.minAmount || '0', 'to', filters.maxAmount || 'Unlimited'])
  }
  
  transactionData.push([])
  transactionData.push(['Transaction Details'])
  transactionData.push(['Date', 'Type', 'Description', 'Source', 'Payment Method', 'Amount', 'Reference'])
  
  // Add transaction rows
  transactions.forEach(transaction => {
    transactionData.push([
      formatDateForExport(transaction.date || transaction.createdAt).date,
      transaction.type || 'N/A',
      transaction.description || 'No description',
      transaction.source || 'Manual Entry',
      transaction.paymentMethod || 'N/A',
      transaction.amount || 0,
      transaction.reference || ''
    ])
  })
  
  // Add summary
  transactionData.push([])
  transactionData.push(['Summary'])
  
  const totalCredit = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  
  const totalDebit = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const balance = entityType === 'customer' 
    ? totalCredit - totalDebit 
    : totalDebit - totalCredit

  transactionData.push(['Total Credit:', '', '', '', '', '', totalCredit])
  transactionData.push(['Total Debit:', '', '', '', '', '', totalDebit])
  transactionData.push(['Net Balance:', '', '', '', '', '', balance])
  
  const ws = XLSX.utils.aoa_to_sheet(transactionData)
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // Date
    { wch: 12 }, // Type
    { wch: 40 }, // Description
    { wch: 20 }, // Source
    { wch: 15 }, // Payment Method
    { wch: 15 }, // Amount
    { wch: 20 }  // Reference
  ]
  
  XLSX.utils.book_append_sheet(wb, ws, 'Transaction History')
  
  // Create separate summary sheet
  const summaryData = [
    [`${entityType === 'customer' ? 'Customer' : 'Supplier'} Transaction Summary`],
    [`${entityType === 'customer' ? 'Customer' : 'Supplier'}: ${entityName}`],
    [],
    ['Summary'],
    ['Total Credit:', totalCredit],
    ['Total Debit:', totalDebit],
    ['Net Balance:', balance],
    [],
    ['Transaction Count:', transactions.length],
    ['Export Date:', formatDateForExport(new Date()).date]
  ]
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
  summaryWs['!cols'] = [
    { wch: 20 }, // Label
    { wch: 20 }  // Value
  ]
  
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')
  
  // Save Excel file
  const fileName = `${entityType}_Transaction_History_${entityName.replace(/\s+/g, '_')}_${formatDateForExport(new Date()).date}.xlsx`
  XLSX.writeFile(wb, fileName)
}

/**
 * Export Entries Report to PDF
 */
export const exportEntriesReportToPDF = (entries, summary, startDate, endDate, categoryLabel) => {
  const doc = new jsPDF('l', 'mm', 'a4')
  if (!autoTable) {
    alert('PDF export plugin not available.')
    return
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Entries Report', 148, 12, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`From: ${startDate}  To: ${endDate}${categoryLabel ? `  |  Category: ${categoryLabel}` : ''}`, 14, 18)
  doc.text(`Total Credit: ${formatCurrencyForExport(summary?.totalCredit || 0)}  |  Total Debit: ${formatCurrencyForExport(summary?.totalDebit || 0)}  |  Balance: ${formatCurrencyForExport(summary?.closingBalance || 0)}  |  Records: ${summary?.count || 0}`, 14, 24)

  const headers = [['Date', 'Type', 'Category', 'Name', 'Description', 'Account/Customer', 'Mazdoor/Supplier', 'Payment', 'Amount']]
  const rows = (entries || []).map(e => [
    e.date,
    e.type === 'credit' ? 'Credit' : 'Debit',
    e.category || '-',
    e.name || '',
    (e.description || '').substring(0, 25),
    e.type === 'credit' ? (e.account || e.customer || '-') : '-',
    e.type === 'debit' ? (e.mazdoor || e.supplier || '-') : '-',
    e.paymentMethod || '-',
    (e.type === 'credit' ? '+' : '-') + formatCurrencyForExport(e.amount)
  ])

  autoTable(doc, {
    startY: 28,
    head: headers,
    body: rows,
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [240, 240, 240], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 18 },
      2: { cellWidth: 22 },
      3: { cellWidth: 28 },
      4: { cellWidth: 28 },
      5: { cellWidth: 28 },
      6: { cellWidth: 25 },
      7: { cellWidth: 18 },
      8: { cellWidth: 22, halign: 'right' }
    }
  })

  doc.save(`Entries_Report_${startDate}_to_${endDate}.pdf`)
}

/**
 * Export Entries Report to Excel
 */
export const exportEntriesReportToExcel = (entries, summary, startDate, endDate) => {
  const wb = XLSX.utils.book_new()
  const headers = ['Date', 'Type', 'Category', 'Name', 'Description', 'Account/Customer', 'Mazdoor/Supplier', 'Payment Method', 'Amount']
  const rows = (entries || []).map(e => [
    e.date,
    e.type === 'credit' ? 'Credit' : 'Debit',
    e.category || '',
    e.name || '',
    e.description || '',
    e.type === 'credit' ? (e.account || e.customer || '') : '',
    e.type === 'debit' ? (e.mazdoor || e.supplier || '') : '',
    e.paymentMethod || '',
    e.amount || 0
  ])
  const data = [
    ['Entries Report'],
    [`From: ${startDate}  To: ${endDate}`],
    ['Total Credit', summary?.totalCredit || 0],
    ['Total Debit', summary?.totalDebit || 0],
    ['Balance', summary?.closingBalance || 0],
    ['Record Count', summary?.count || 0],
    [],
    headers,
    ...rows
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 22 }, { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Entries')
  XLSX.writeFile(wb, `Entries_Report_${startDate}_to_${endDate}.xlsx`)
}