import terms from '../terms.json'

interface Term {
  term: string
  definition: string
  usage: string
  context?: string[]
  variants?: string[]
  dont?: string[]
  caution?: string[]
  notes?: string
}

const allTerms: Term[] = (terms as Term[]).slice().sort((a, b) => a.term.localeCompare(b.term))

// ── DOM refs ──
const searchInput   = document.getElementById('search') as HTMLInputElement
const termList      = document.getElementById('term-list') as HTMLElement
const resultsMeta   = document.getElementById('results-meta') as HTMLElement
const listView      = document.getElementById('list-view') as HTMLElement
const detailView    = document.getElementById('detail-view') as HTMLElement
const backBtn       = document.getElementById('back-btn') as HTMLButtonElement
const copyBtn       = document.getElementById('copy-btn') as HTMLButtonElement
const insertBtn     = document.getElementById('insert-btn') as HTMLButtonElement

let selectedTerm: Term | null = null

// ── Search ──
searchInput.addEventListener('input', () => renderList())

function renderList() {
  const query = searchInput.value.toLowerCase().trim()

  const filtered = query
    ? allTerms.filter((t) =>
        t.term.toLowerCase().includes(query) ||
        t.definition.toLowerCase().includes(query) ||
        t.variants?.some((v) => v.toLowerCase().includes(query)) ||
        t.dont?.some((d) => d.toLowerCase().includes(query)) ||
        t.caution?.some((c) => c.toLowerCase().includes(query))
      )
    : allTerms

  resultsMeta.textContent = query
    ? `${filtered.length} of ${allTerms.length} terms`
    : `${allTerms.length} terms`

  termList.innerHTML = ''

  if (filtered.length === 0) {
    termList.innerHTML = '<p class="empty">No terms found.</p>'
    return
  }

  filtered.forEach((term) => {
    const item = document.createElement('div')
    item.className = 'term-item'
    item.innerHTML = `
      <span class="term-name">${escapeHtml(term.term)}</span>
      <span class="term-preview">${escapeHtml(term.definition)}</span>
    `
    item.addEventListener('click', () => showDetail(term))
    termList.appendChild(item)
  })
}

// ── Detail view ──
function showDetail(term: Term) {
  selectedTerm = term
  listView.style.display = 'none'
  detailView.style.display = 'flex'

  document.getElementById('detail-term')!.textContent = term.term
  document.getElementById('detail-definition')!.textContent = term.definition
  document.getElementById('detail-usage')!.textContent = term.usage

  setTags('section-context', 'detail-context', term.context, 'tag-context')
  setTags('section-variants', 'detail-variants', term.variants, 'tag-variant')
  setTags('section-dont', 'detail-dont', term.dont, 'tag-dont')
  setTags('section-caution', 'detail-caution', term.caution, 'tag-caution')
  setText('section-notes', 'detail-notes', term.notes)

  resetButton(copyBtn, 'Copy term')
  resetButton(insertBtn, 'Insert into selection')
  insertBtn.classList.remove('error', 'success')
}

function setTags(sectionId: string, contentId: string, items: string[] | undefined, cls: string) {
  const section = document.getElementById(sectionId)!
  if (items && items.length > 0) {
    document.getElementById(contentId)!.innerHTML = items
      .map((i) => `<span class="tag ${cls}">${escapeHtml(i)}</span>`)
      .join('')
    section.style.display = 'flex'
  } else {
    section.style.display = 'none'
  }
}

function setText(sectionId: string, contentId: string, value: string | undefined) {
  const section = document.getElementById(sectionId)!
  if (value) {
    document.getElementById(contentId)!.textContent = value
    section.style.display = 'flex'
  } else {
    section.style.display = 'none'
  }
}

// ── Back ──
backBtn.addEventListener('click', () => {
  detailView.style.display = 'none'
  listView.style.display = 'flex'
  selectedTerm = null
})

// ── Copy ──
copyBtn.addEventListener('click', () => {
  if (!selectedTerm) return
  navigator.clipboard.writeText(selectedTerm.term).then(() => {
    copyBtn.textContent = 'Copied!'
    copyBtn.classList.add('success')
    setTimeout(() => {
      resetButton(copyBtn, 'Copy term')
    }, 1500)
  })
})

// ── Insert ──
insertBtn.addEventListener('click', () => {
  if (!selectedTerm) return
  parent.postMessage({ pluginMessage: { type: 'insert-term', text: selectedTerm.term } }, '*')
})

// ── Messages from plugin backend ──
window.onmessage = (event) => {
  const msg = event.data.pluginMessage
  if (!msg) return

  if (msg.type === 'insert-result') {
    if (msg.success) {
      insertBtn.textContent = 'Inserted!'
      insertBtn.classList.add('success')
      setTimeout(() => {
        resetButton(insertBtn, 'Insert into selection')
        insertBtn.classList.remove('success')
      }, 1500)
    } else {
      insertBtn.textContent = msg.message
      insertBtn.classList.add('error')
      setTimeout(() => {
        resetButton(insertBtn, 'Insert into selection')
        insertBtn.classList.remove('error')
      }, 2500)
    }
  }
}

// ── Helpers ──
function resetButton(btn: HTMLButtonElement, label: string) {
  btn.textContent = label
  btn.classList.remove('success', 'error')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Init ──
renderList()
