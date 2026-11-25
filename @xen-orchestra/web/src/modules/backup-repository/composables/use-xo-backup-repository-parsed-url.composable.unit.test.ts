import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { runComposable } from '@/test/run-composable.ts'
import { type MaybeRefOrGetter, ref } from 'vue'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

function runParsedUrl(br: MaybeRefOrGetter<FrontXoBackupRepository | undefined>) {
  return runComposable(() => useXoBackupRepositoryParsedUrl(br))
}

describe('useXoBackupRepositoryParsedUrl', () => {
  it('parses the url of the repository', () => {
    const url = 'nfs://192.168.100.225:/media/nfs?useVhdDirectory=true'

    expect(runParsedUrl(createBr({ url })).value).toEqual(parseBackupRepositoryUrl(url))
  })

  it('returns undefined when there is no repository', () => {
    expect(runParsedUrl(undefined).value).toBeUndefined()
  })

  it('reacts to changes of the source repository', () => {
    const br = ref<FrontXoBackupRepository | undefined>(createBr({ url: 'nfs://192.168.100.225:/media/nfs' }))
    const parsedUrl = runParsedUrl(br)

    br.value = createBr({ url: 's3://key:secret@s3.us-west-1.amazonaws.com/my-bucket/backups' })

    expect(parsedUrl.value?.type).toBe('s3')
  })

  it('accepts a getter as source', () => {
    const br = createBr({ url: 'nfs://192.168.100.225:/media/nfs' })

    expect(runParsedUrl(() => br).value).toEqual(parseBackupRepositoryUrl(br.url))
  })
})
