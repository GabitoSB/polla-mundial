import html2canvas from 'html2canvas'

export async function copyElementImage(
  element,
  { backgroundColor = '#ffffff', fileName = 'pulpo-paul.png', windowWidth, scale = 2 } = {},
) {
  const width = windowWidth ?? element.offsetWidth

  const canvas = await html2canvas(element, {
    backgroundColor,
    scale,
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: -window.scrollY,
    width,
    windowWidth: width,
    onclone: (_doc, clonedElement) => {
      if (clonedElement) {
        clonedElement.style.opacity = '1'
        clonedElement.style.visibility = 'visible'
        clonedElement.style.position = 'static'
        clonedElement.style.left = '0'
      }
      _doc.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src') ?? ''
        if (src && !src.startsWith('data:')) {
          img.crossOrigin = 'anonymous'
        }
      })
    },
  })

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('blob_failed'))), 'image/png')
  })

  if (navigator.clipboard?.write && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      return 'clipboard'
    } catch {
      /* en móvil el portapapeles suele fallar; descargar */
    }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
  return 'download'
}
