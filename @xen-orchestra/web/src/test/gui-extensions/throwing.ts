export default function setup() {
  ;(globalThis as any).guiExtensionCalls.push(['throwing'])
  throw new Error('extension failure')
}
