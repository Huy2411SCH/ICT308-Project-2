import { jsPDF } from 'jspdf'

const PAGE_MARGIN = 50
const LINE_HEIGHT = 1.4

// Builds a PDF of a file's summary and transcript and starts the download.
// `summary` is the structured summary (or null); `turns` is the list of
// { speaker, text } entries from the transcript.
export function downloadPdf({ fileName, date, duration, summary, turns }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const textWidth = pageWidth - PAGE_MARGIN * 2
  let y = PAGE_MARGIN

  // Writes wrapped text, starting a new page whenever the next line won't fit.
  const write = (text, { size = 11, bold = false, indent = 0, gapAfter = 6, color = 20 } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(color)
    const lineHeight = size * LINE_HEIGHT
    for (const line of doc.splitTextToSize(String(text), textWidth - indent)) {
      if (y + lineHeight > pageHeight - PAGE_MARGIN) {
        doc.addPage()
        y = PAGE_MARGIN
      }
      doc.text(line, PAGE_MARGIN + indent, y + size)
      y += lineHeight
    }
    y += gapAfter
  }

  const bullet = (text) => {
    // Move to a new page first if needed, so the bullet lands beside its text.
    if (y + 11 * LINE_HEIGHT > pageHeight - PAGE_MARGIN) {
      doc.addPage()
      y = PAGE_MARGIN
    }
    const startY = y
    write(text, { indent: 14, gapAfter: 4 })
    doc.setFont('helvetica', 'normal')
    doc.text('•', PAGE_MARGIN + 2, startY + 11)
  }

  const sectionHeading = (text) => {
    y += 10
    write(text, { size: 15, bold: true, gapAfter: 4 })
    doc.setDrawColor(200)
    doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y)
    y += 10
  }

  write(fileName, { size: 18, bold: true, gapAfter: 2 })
  write([date, duration].filter(Boolean).join('  ·  '), { size: 10, color: 110, gapAfter: 8 })

  sectionHeading('Summary')
  if (summary) {
    if (summary.title) write(summary.title, { size: 13, bold: true })
    if (summary.intro) write(summary.intro, { gapAfter: 10 })
    for (const section of summary.sections) {
      if (section.heading) write(section.heading, { size: 12, bold: true, gapAfter: 4 })
      section.points.forEach(bullet)
      y += 6
    }
    if (summary.actionItems?.length > 0) {
      write('Action Items', { size: 12, bold: true, gapAfter: 4 })
      summary.actionItems.forEach(bullet)
    }
  } else {
    write('No summary available.', { color: 110 })
  }

  sectionHeading('Transcript')
  for (const turn of turns) {
    if (turn.speaker) write(turn.speaker, { size: 10, bold: true, gapAfter: 2, color: 70 })
    write(turn.text, { gapAfter: 10 })
  }

  doc.save(`${fileName.replace(/\.[^.]+$/, '') || 'transcript'}.pdf`)
}
