import terms from '../terms.json'
import componentsData from '../components.json'
import checklistData from '../checklist.json'
import styleGuideContent from '../style-guide.md'

// ── Types ──────────────────────────────────────────────────────────────────

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

interface Component {
  name: string
  inputs?: string[]
  outputs?: string[]
  constraints?: Record<string, unknown>
  tone?: string[]
  generation_rules?: string[]
  rewrite_rules?: string[]
  examples?: Record<string, unknown>
  states?: Record<string, { tone: string[] }>
  structure?: string[]
}

interface ComponentsData {
  version: string
  global_rules: { priorities: string[]; never: string[] }
  components: Component[]
}

interface ChecklistGroup {
  title: string
  subtitle: string
  priority: 'high' | 'medium' | 'low'
  items: string[]
}

interface ChecklistData {
  groups: ChecklistGroup[]
}

// ── Data ───────────────────────────────────────────────────────────────────

const allTerms: Term[]           = (terms as Term[]).slice().sort((a, b) => a.term.localeCompare(b.term))
const allComponents: Component[] = (componentsData as ComponentsData).components
const allGroups: ChecklistGroup[] = (checklistData as ChecklistData).groups

// ── Tab switching ──────────────────────────────────────────────────────────

document.querySelectorAll<HTMLButtonElement>('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.getAttribute('data-tab')!
    document.querySelectorAll<HTMLButtonElement>('.tab').forEach(b =>
      b.classList.toggle('active', b.getAttribute('data-tab') === tabName)
    )
    document.querySelectorAll<HTMLElement>('.panel').forEach(p =>
      p.classList.toggle('active', p.id === `panel-${tabName}`)
    )
  })
})

// ── Terms tab ─────────────────────────────────────────────────────────────

const searchInput     = document.getElementById('search') as HTMLInputElement
const termList        = document.getElementById('term-list') as HTMLElement
const resultsMeta     = document.getElementById('results-meta') as HTMLElement
const termsListView   = document.getElementById('terms-list-view') as HTMLElement
const termsDetailView = document.getElementById('terms-detail-view') as HTMLElement
const termsBackBtn    = document.getElementById('terms-back-btn') as HTMLButtonElement
const copyBtn         = document.getElementById('copy-btn') as HTMLButtonElement
const insertBtn       = document.getElementById('insert-btn') as HTMLButtonElement

let selectedTerm: Term | null = null

searchInput.addEventListener('input', () => renderTermsList())

function renderTermsList() {
  const query = searchInput.value.toLowerCase().trim()
  const filtered = query
    ? allTerms.filter(t =>
        t.term.toLowerCase().includes(query) ||
        t.definition.toLowerCase().includes(query) ||
        t.variants?.some(v => v.toLowerCase().includes(query)) ||
        t.dont?.some(d => d.toLowerCase().includes(query)) ||
        t.caution?.some(c => c.toLowerCase().includes(query))
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

  filtered.forEach(term => {
    const item = document.createElement('div')
    item.className = 'list-item'
    item.innerHTML = `
      <span class="item-name">${escapeHtml(term.term)}</span>
      <span class="item-preview">${escapeHtml(term.definition)}</span>
    `
    item.addEventListener('click', () => showTermDetail(term))
    termList.appendChild(item)
  })
}

function showTermDetail(term: Term) {
  selectedTerm = term
  termsListView.style.display = 'none'
  termsDetailView.classList.add('visible')

  document.getElementById('detail-term')!.textContent = term.term
  document.getElementById('detail-definition')!.textContent = term.definition
  document.getElementById('detail-usage')!.textContent = term.usage

  setTags('section-context',  'detail-context',  term.context,  'tag-context')
  setTags('section-variants', 'detail-variants', term.variants, 'tag-variant')
  setTags('section-dont',     'detail-dont',     term.dont,     'tag-dont')
  setTags('section-caution',  'detail-caution',  term.caution,  'tag-caution')
  setText('section-notes',    'detail-notes',    term.notes)

  resetButton(copyBtn,   'Copy term')
  resetButton(insertBtn, 'Insert into selection')
  insertBtn.classList.remove('error', 'success')
}

termsBackBtn.addEventListener('click', () => {
  termsDetailView.classList.remove('visible')
  termsListView.style.display = 'flex'
  selectedTerm = null
})

copyBtn.addEventListener('click', () => {
  if (!selectedTerm) return
  copyToClipboard(selectedTerm.term, copyBtn, 'Copy term')
})

insertBtn.addEventListener('click', () => {
  if (!selectedTerm) return
  parent.postMessage({ pluginMessage: { type: 'insert-term', text: selectedTerm.term } }, '*')
})

window.onmessage = (event) => {
  const msg = event.data.pluginMessage
  if (!msg) return

  if (msg.type === 'selection-text') {
    pullBtn.textContent = 'Pull from selection'
    pullBtn.style.pointerEvents = 'auto'

    if (msg.empty || msg.frames.length === 0) {
      textPreviewContent.innerHTML = '<p style="font-size:11px; color:#aaa;">No text found. Select one or more frames first.</p>'
      textPreview.style.display = 'block'
      return
    }

    pulledFrames = msg.frames
    textPreviewContent.innerHTML = msg.frames.map((f: { name: string; nodes: { text: string; nodeId: string }[] }) => `
      <div class="preview-frame">
        <div class="preview-frame-name">${escapeHtml(f.name)}</div>
        ${f.nodes.map(n => `<div class="preview-text-item">${escapeHtml(n.text)}</div>`).join('')}
      </div>
    `).join('')

    textPreview.style.display = 'block'
  }

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

// ── Components tab ────────────────────────────────────────────────────────

const componentList   = document.getElementById('component-list') as HTMLElement
const compListView    = document.getElementById('comp-list-view') as HTMLElement
const compDetailView  = document.getElementById('comp-detail-view') as HTMLElement
const compDetailTitle = document.getElementById('comp-detail-title') as HTMLElement
const compDetailBody  = document.getElementById('comp-detail-body') as HTMLElement
const compBackBtn     = document.getElementById('comp-back-btn') as HTMLButtonElement

function formatCompName(name: string): string {
  return name.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())
}

function renderComponentList() {
  componentList.innerHTML = ''
  allComponents.forEach(comp => {
    const item = document.createElement('div')
    item.className = 'list-item'
    item.innerHTML = `
      <span class="item-name">${escapeHtml(formatCompName(comp.name))}</span>
      <span class="item-preview">${escapeHtml((comp.tone || []).join(', ') || '—')}</span>
    `
    item.addEventListener('click', () => showCompDetail(comp))
    componentList.appendChild(item)
  })
}

function showCompDetail(comp: Component) {
  compListView.style.display = 'none'
  compDetailView.classList.add('visible')
  compDetailTitle.textContent = formatCompName(comp.name)

  const sections: string[] = []

  if (comp.tone && comp.tone.length > 0) {
    sections.push(`
      <div class="detail-section">
        <label>Tone</label>
        <div class="tags">${comp.tone.map(t => `<span class="tag tag-tone">${escapeHtml(t)}</span>`).join('')}</div>
      </div>
    `)
  }

  if (comp.inputs && comp.inputs.length > 0) {
    sections.push(`
      <div class="detail-section">
        <label>Inputs</label>
        <ul>${comp.inputs.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
      </div>
    `)
  }

  if (comp.outputs && comp.outputs.length > 0) {
    sections.push(`
      <div class="detail-section">
        <label>Outputs</label>
        <ul>${comp.outputs.map(o => `<li>${escapeHtml(o)}</li>`).join('')}</ul>
      </div>
    `)
  }

  if (comp.constraints && Object.keys(comp.constraints).length > 0) {
    const rows = Object.entries(comp.constraints)
      .map(([k, v]) => `<div class="kv-row"><span class="kv-key">${escapeHtml(k.replace(/_/g, ' '))}</span><span class="kv-val">${escapeHtml(String(v))}</span></div>`)
      .join('')
    sections.push(`
      <div class="detail-section">
        <label>Constraints</label>
        <div class="kv-list">${rows}</div>
      </div>
    `)
  }

  if (comp.states) {
    const rows = Object.entries(comp.states)
      .map(([state, val]) => `<div class="kv-row"><span class="kv-key">${escapeHtml(state)}</span><span class="kv-val">${escapeHtml((val.tone || []).join(', '))}</span></div>`)
      .join('')
    sections.push(`
      <div class="detail-section">
        <label>States</label>
        <div class="kv-list">${rows}</div>
      </div>
    `)
  }

  if (comp.generation_rules && comp.generation_rules.length > 0) {
    sections.push(`
      <div class="detail-section">
        <label>Rules</label>
        <ul>${comp.generation_rules.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
      </div>
    `)
  }

  if (comp.examples) {
    const exHtml = renderExamples(comp.examples)
    if (exHtml) {
      sections.push(`
        <div class="detail-section">
          <label>Examples</label>
          ${exHtml}
        </div>
      `)
    }
  }

  compDetailBody.innerHTML = sections.join('')
}

function renderExamples(examples: Record<string, unknown>): string {
  const parts: string[] = []

  if (examples.good) {
    parts.push(`<div class="example-label good">Use</div>`)
    ;(examples.good as unknown[]).forEach(ex => {
      if (typeof ex === 'string') {
        parts.push(`<div class="example-block">${escapeHtml(ex)}</div>`)
      } else if (typeof ex === 'object' && ex !== null) {
        const text = Object.entries(ex as Record<string, string>)
          .map(([k, v]) => `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}`)
          .join('<br>')
        parts.push(`<div class="example-block">${text}</div>`)
      }
    })
  }

  if (examples.bad) {
    parts.push(`<div class="example-label bad">Don't use</div>`)
    ;(examples.bad as unknown[]).forEach(ex => {
      if (typeof ex === 'string') {
        parts.push(`<div class="example-block">${escapeHtml(ex)}</div>`)
      } else if (typeof ex === 'object' && ex !== null) {
        const text = Object.entries(ex as Record<string, string>)
          .map(([k, v]) => `<strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}`)
          .join('<br>')
        parts.push(`<div class="example-block">${text}</div>`)
      }
    })
  }

  ;['success', 'warning', 'error', 'info'].forEach(key => {
    if (examples[key]) {
      parts.push(`<div class="example-label state">${escapeHtml(key)}</div>`)
      ;(examples[key] as string[]).forEach(ex => {
        parts.push(`<div class="example-block">${escapeHtml(ex)}</div>`)
      })
    }
  })

  return parts.join('')
}

compBackBtn.addEventListener('click', () => {
  compDetailView.classList.remove('visible')
  compListView.style.display = 'flex'
})

// ── Style guide tab ───────────────────────────────────────────────────────

function renderStyleGuide() {
  document.getElementById('style-content')!.innerHTML = renderMarkdown(styleGuideContent)
}

function renderMarkdown(md: string): string {
  const lines = md.split('\n')
  const html: string[] = []
  let inList = false
  let listTag = 'ul'

  const closeList = () => {
    if (inList) { html.push(`</${listTag}>`); inList = false }
  }

  for (const line of lines) {
    const isBullet   = /^\s*- /.test(line)
    const isNumbered = /^\d+\.\s/.test(line)

    if (!isBullet && !isNumbered) closeList()

    if (line.startsWith('### ')) {
      html.push(`<h4>${escapeHtml(line.slice(4))}</h4>`)
    } else if (line.startsWith('## ')) {
      html.push(`<h3>${escapeHtml(line.slice(3))}</h3>`)
    } else if (line.startsWith('# ')) {
      html.push(`<h2>${escapeHtml(line.slice(2))}</h2>`)
    } else if (line.startsWith('---')) {
      html.push('<hr>')
    } else if (isBullet) {
      const text = line.replace(/^\s*- /, '')
      if (!inList) { html.push('<ul>'); inList = true; listTag = 'ul' }
      html.push(`<li>${escapeHtml(text)}</li>`)
    } else if (isNumbered) {
      const text = line.replace(/^\d+\.\s/, '')
      if (!inList) { html.push('<ol>'); inList = true; listTag = 'ol' }
      html.push(`<li>${escapeHtml(text)}</li>`)
    } else if (line.trim()) {
      html.push(`<p>${escapeHtml(line.trim())}</p>`)
    }
  }

  closeList()
  return html.join('')
}

// ── Checklist tab ─────────────────────────────────────────────────────────

const checklistContent  = document.getElementById('checklist-content') as HTMLElement
const checklistProgress = document.getElementById('checklist-progress') as HTMLElement
const resetBtn          = document.getElementById('reset-btn') as HTMLButtonElement

function renderChecklist() {
  checklistContent.innerHTML = ''

  allGroups.forEach((group, gi) => {
    const dotClass = { high: 'dot-high', medium: 'dot-medium', low: 'dot-low' }[group.priority]

    const groupEl = document.createElement('div')
    groupEl.className = 'check-group'
    groupEl.id = `check-group-${gi}`
    groupEl.innerHTML = `
      <div class="check-group-title" id="check-group-title-${gi}">
        <span class="priority-dot ${dotClass}"></span>
        ${escapeHtml(group.title)}
        <span style="font-weight:400; text-transform:none; letter-spacing:0; color:#bbb">${escapeHtml(group.subtitle)}</span>
      </div>
    `

    group.items.forEach((item, ii) => {
      const id = `check-${gi}-${ii}`
      const itemEl = document.createElement('div')
      itemEl.className = 'check-item'
      itemEl.id = `item-${gi}-${ii}`
      itemEl.innerHTML = `
        <input type="checkbox" id="${id}" />
        <label for="${id}">${escapeHtml(item)}</label>
      `
      itemEl.querySelector('input')!.addEventListener('change', (e) => {
        itemEl.classList.toggle('checked', (e.target as HTMLInputElement).checked)
        updateProgress()
      })
      groupEl.appendChild(itemEl)
    })

    checklistContent.appendChild(groupEl)
  })

  updateProgress()
}

function updateProgress() {
  const all     = document.querySelectorAll<HTMLInputElement>('#checklist-content input[type="checkbox"]')
  const checked = Array.from(all).filter(cb => cb.checked).length
  checklistProgress.textContent = `${checked} of ${all.length} checked`

  allGroups.forEach((_, gi) => {
    const groupChecks = document.querySelectorAll<HTMLInputElement>(`#check-group-${gi} input[type="checkbox"]`)
    const allDone = Array.from(groupChecks).every(cb => cb.checked)
    document.getElementById(`check-group-title-${gi}`)?.classList.toggle('complete', allDone)
  })
}

resetBtn.addEventListener('click', () => {
  document.querySelectorAll<HTMLInputElement>('#checklist-content input[type="checkbox"]').forEach(cb => {
    cb.checked = false
    cb.closest('.check-item')?.classList.remove('checked')
  })
  updateProgress()
})

// ── Pull text from selection ───────────────────────────────────────────────

const pullBtn            = document.getElementById('pull-btn') as HTMLButtonElement
const textPreview        = document.getElementById('text-preview') as HTMLElement
const textPreviewContent = document.getElementById('text-preview-content') as HTMLElement
const clearPreviewBtn    = document.getElementById('clear-preview-btn') as HTMLButtonElement
const checkTermsBtn      = document.getElementById('check-terms-btn') as HTMLButtonElement
const termsResults       = document.getElementById('terms-results') as HTMLElement
const termsResultsContent = document.getElementById('terms-results-content') as HTMLElement
const clearResultsBtn    = document.getElementById('clear-results-btn') as HTMLButtonElement

let pulledFrames: { name: string; nodes: { text: string; nodeId: string }[] }[] = []

pullBtn.addEventListener('click', () => {
  pullBtn.textContent = 'Pulling…'
  pullBtn.style.pointerEvents = 'none'
  parent.postMessage({ pluginMessage: { type: 'get-selection-text' } }, '*')
})

clearPreviewBtn.addEventListener('click', () => {
  textPreview.style.display = 'none'
  textPreviewContent.innerHTML = ''
  termsResults.style.display = 'none'
  termsResultsContent.innerHTML = ''
  pulledFrames = []
})

clearResultsBtn.addEventListener('click', () => {
  termsResults.style.display = 'none'
  termsResultsContent.innerHTML = ''
})

checkTermsBtn.addEventListener('click', () => {
  if (pulledFrames.length === 0) return
  const results = checkTermsCompliance(pulledFrames)
  renderComplianceResults(results)
})

// ── Terms compliance check ────────────────────────────────────────────────

interface ComplianceResult {
  violations: { word: string; correctTerm: string; nodeIds: string[] }[]
  cautions:   { word: string; termName: string;   nodeIds: string[] }[]
  correct:    string[]
}

function wordInText(word: string, text: string): boolean {
  if (!word.trim()) return false
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = word.includes(' ') ? escaped : `\\b${escaped}\\b`
  return new RegExp(pattern, 'i').test(text)
}

function checkTermsCompliance(frames: { name: string; nodes: { text: string; nodeId: string }[] }[]): ComplianceResult {
  const allNodes = frames.flatMap(f => f.nodes)
  const violations: ComplianceResult['violations'] = []
  const cautions:   ComplianceResult['cautions']   = []
  const correct:    string[]                        = []

  allTerms.forEach(term => {
    term.dont?.forEach(word => {
      if (!word) return
      const matched = allNodes.filter(n => wordInText(word, n.text))
      if (matched.length > 0) {
        violations.push({ word, correctTerm: term.term, nodeIds: matched.map(n => n.nodeId) })
      }
    })
    term.caution?.forEach(word => {
      if (!word) return
      const matched = allNodes.filter(n => wordInText(word, n.text))
      if (matched.length > 0) {
        cautions.push({ word, termName: term.term, nodeIds: matched.map(n => n.nodeId) })
      }
    })
    if (allNodes.some(n => wordInText(term.term, n.text))) {
      correct.push(term.term)
    }
  })

  return { violations, cautions, correct }
}

function renderComplianceResults(results: ComplianceResult) {
  const { violations, cautions, correct } = results
  const parts: string[] = []

  if (violations.length === 0 && cautions.length === 0 && correct.length === 0) {
    parts.push('<p style="font-size:11px; color:#aaa;">No matching terms found in the selected text.</p>')
  }

  if (violations.length > 0) {
    parts.push(`<div class="results-group">
      <div class="results-group-label violation">❌ Don't use (${violations.length})</div>
      ${violations.map(v => `
        <div class="results-item">
          <span class="wrong-word">${escapeHtml(v.word)}</span>
          <span class="arrow">→</span>
          use <span class="correct-word">${escapeHtml(v.correctTerm)}</span>
          <button class="show-btn" data-node-ids="${escapeHtml(v.nodeIds.join(','))}">Show</button>
        </div>`).join('')}
    </div>`)
  }

  if (cautions.length > 0) {
    parts.push(`<div class="results-group">
      <div class="results-group-label caution">⚠️ Use with caution (${cautions.length})</div>
      ${cautions.map(c => `
        <div class="results-item">
          <span class="caution-word">${escapeHtml(c.word)}</span>
          <span class="arrow">→</span>
          check <span style="font-weight:600">${escapeHtml(c.termName)}</span> rules
          <button class="show-btn" data-node-ids="${escapeHtml(c.nodeIds.join(','))}">Show</button>
        </div>`).join('')}
    </div>`)
  }

  if (correct.length > 0) {
    parts.push(`<div class="results-group">
      <div class="results-group-label correct">✓ Correct terms found (${correct.length})</div>
      ${correct.map(t => `<div class="results-item"><span class="correct-word">${escapeHtml(t)}</span></div>`).join('')}
    </div>`)
  }

  termsResultsContent.innerHTML = parts.join('')
  termsResults.style.display = 'block'
}

// Delegated click handler for "Show" buttons
termsResultsContent.addEventListener('click', (e) => {
  const btn = (e.target as HTMLElement).closest('.show-btn') as HTMLElement | null
  if (!btn) return
  const nodeIds = btn.getAttribute('data-node-ids')!.split(',').filter(Boolean)
  parent.postMessage({ pluginMessage: { type: 'highlight-node', nodeIds } }, '*')
})

// ── Helpers ───────────────────────────────────────────────────────────────

function setTags(sectionId: string, contentId: string, items: string[] | undefined, cls: string) {
  const section = document.getElementById(sectionId)!
  if (items && items.length > 0) {
    document.getElementById(contentId)!.innerHTML = items
      .map(i => `<span class="tag ${cls}">${escapeHtml(i)}</span>`)
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

function resetButton(btn: HTMLButtonElement, label: string) {
  btn.textContent = label
  btn.classList.remove('success', 'error')
}

function copyToClipboard(text: string, btn: HTMLButtonElement, originalLabel: string) {
  const succeed = () => {
    btn.textContent = 'Copied!'
    btn.classList.add('success')
    setTimeout(() => resetButton(btn, originalLabel), 1500)
  }
  const fail = () => {
    btn.textContent = 'Copy failed'
    setTimeout(() => resetButton(btn, originalLabel), 1500)
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(succeed).catch(() => fallbackCopy(text, succeed, fail))
  } else {
    fallbackCopy(text, succeed, fail)
  }
}

function fallbackCopy(text: string, succeed: () => void, fail: () => void) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.cssText = 'position:fixed;opacity:0;top:0;left:0;'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  try {
    document.execCommand('copy')
    succeed()
  } catch {
    fail()
  }
  document.body.removeChild(textarea)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Init ──────────────────────────────────────────────────────────────────

renderTermsList()
renderComponentList()
renderStyleGuide()
renderChecklist()
