import type { GuiExtensionSetup } from '@/shared/utils/gui-extensions.util.ts'

const setup: GuiExtensionSetup = context => {
  ;(globalThis as any).guiExtensionCalls.push(['valid', context])
}

export default setup
