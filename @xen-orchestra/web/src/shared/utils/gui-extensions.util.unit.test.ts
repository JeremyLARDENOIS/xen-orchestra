import { loadGuiExtensions } from '@/shared/utils/gui-extensions.util.ts'
import * as vue from 'vue'

const FIXTURES = '/src/test/gui-extensions'

const context = { app: {}, i18n: {}, pinia: {}, router: {} } as unknown as Parameters<typeof loadGuiExtensions>[0]

const mockExtensions = (xo6: string[]) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ xo5: [], xo6 })))
  )

describe('loadGuiExtensions', () => {
  let calls: unknown[][]

  beforeEach(() => {
    calls = (globalThis as any).guiExtensionCalls = []
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('fetches the XO 6 extensions', async () => {
    mockExtensions([])

    await loadGuiExtensions(context)

    expect(fetch).toHaveBeenCalledWith('/rest/v0/gui-extensions')
  })

  it('calls each extension with the context and the shared modules', async () => {
    mockExtensions([`${FIXTURES}/valid.ts`])

    await loadGuiExtensions(context)

    expect(calls).toHaveLength(1)
    const [, received] = calls[0] as [string, any]
    expect(received).toMatchObject(context)
    expect(received.modules.vue).toBe(vue)
  })

  it('skips failing extensions without preventing the others from loading', async () => {
    mockExtensions([
      `${FIXTURES}/missing.ts`,
      `${FIXTURES}/no-default.ts`,
      `${FIXTURES}/throwing.ts`,
      `${FIXTURES}/valid.ts`,
    ])

    await expect(loadGuiExtensions(context)).resolves.toBeUndefined()

    expect(calls.map(([name]) => name)).toEqual(['throwing', 'valid'])
    expect(console.error).toHaveBeenCalledTimes(3)
  })

  it('does not throw when the extensions cannot be fetched', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 500 }))
    )

    await expect(loadGuiExtensions(context)).resolves.toBeUndefined()
    expect(console.error).toHaveBeenCalledOnce()
  })
})
