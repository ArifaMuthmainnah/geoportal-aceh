import { useState } from 'react'

function CopyLinkButton({ text, label = 'Salin', copiedLabel = 'Tersalin!', className = '' }) {

  const [copied, setCopied] = useState(false)

  async function handleCopy(event) {

    event.preventDefault()
    event.stopPropagation()

    if (!text) return

    try {

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)

    } catch (err) {
      console.error('Gagal menyalin teks:', err)
    }

  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`icon-tooltip-btn copy-icon-btn ${className}`}
      data-tooltip={copied ? copiedLabel : label}
      aria-label={label}
    >
      {copied ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="12" height="12" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )

}

export default CopyLinkButton