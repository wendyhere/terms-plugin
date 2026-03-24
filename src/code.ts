// Plugin backend — runs in Figma's sandbox (no DOM access)
// Communicates with the UI via postMessage

figma.showUI(__html__, { width: 320, height: 500, title: 'Terminology' })

figma.ui.onmessage = async (msg: { type: string; text?: string }) => {
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

  if (msg.type === 'close') {
    figma.closePlugin()
  }
}
