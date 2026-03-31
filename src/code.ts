// Plugin backend — runs in Figma's sandbox (no DOM access)
// Communicates with the UI via postMessage

figma.showUI(__html__, { width: 320, height: 500, title: 'Terminology' })

figma.ui.onmessage = async (msg: { type: string; text?: string; nodeIds?: string[] }) => {
  if (msg.type === 'insert-term') {
    const selection = figma.currentPage.selection
    const textNodes = selection.filter((node) => node.type === 'TEXT') as TextNode[]

    if (textNodes.length === 0) {
      figma.ui.postMessage({ type: 'insert-result', success: false, message: 'Select a text layer first.' })
      return
    }

    for (const node of textNodes) {
      const fontName = node.fontName

      if (fontName === figma.mixed) {
        figma.ui.postMessage({
          type: 'insert-result',
          success: false,
          message: 'Text layer has mixed fonts. Select a single-style layer.',
        })
        return
      }

      await figma.loadFontAsync(fontName)
      node.characters = msg.text ?? ''
    }

    figma.ui.postMessage({ type: 'insert-result', success: true })
  }

  if (msg.type === 'get-selection-text') {
    const selection = figma.currentPage.selection

    if (selection.length === 0) {
      figma.ui.postMessage({ type: 'selection-text', frames: [], empty: true })
      return
    }

    const frames = selection.map(node => ({
      name: node.name,
      nodes: extractText(node).filter(n => n.text.trim() !== ''),
    })).filter(f => f.nodes.length > 0)

    figma.ui.postMessage({ type: 'selection-text', frames, empty: false })
  }

  if (msg.type === 'highlight-node') {
    const nodeIds: string[] = msg.nodeIds ?? []
    const nodes = nodeIds
      .map((id: string) => figma.getNodeById(id))
      .filter((n): n is SceneNode => n !== null && n.type !== 'DOCUMENT' && n.type !== 'PAGE')

    if (nodes.length > 0) {
      figma.currentPage.selection = nodes
      figma.viewport.scrollAndZoomIntoView(nodes)
    }
  }

  if (msg.type === 'close') {
    figma.closePlugin()
  }
}

function extractText(node: SceneNode): { text: string; nodeId: string }[] {
  if (node.type === 'TEXT') return [{ text: node.characters, nodeId: node.id }]
  if ('children' in node) {
    return node.children.flatMap(child => extractText(child))
  }
  return []
}
