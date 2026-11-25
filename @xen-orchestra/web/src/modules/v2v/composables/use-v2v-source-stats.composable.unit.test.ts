import { useV2vSourceStats } from '@/modules/v2v/composables/use-v2v-source-stats.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createV2vColdAndWarmImportVms, createV2vImportVm } from '@/test/create-v2v-import-vm.ts'
import { V2V_TEST_SOURCE } from '@/test/create-v2v-inventory.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { runComposable } from '@/test/run-composable.ts'
import { type MaybeRefOrGetter, ref } from 'vue'

vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-vm-collection.ts')
)

beforeEach(() => {
  vmCollectionMock.reset()
})

function runSourceStats(sourceId: MaybeRefOrGetter<string | undefined>) {
  return runComposable(() => useV2vSourceStats(sourceId))
}

it('counts the warm and cold imports of the source', () => {
  vmCollectionMock.vms.value = [
    ...createV2vColdAndWarmImportVms(),
    createV2vImportVm({ sourceId: 'other-vcenter' }, { id: 'xo-vm-3' as FrontXoVm['id'] }),
  ]

  expect(runSourceStats(V2V_TEST_SOURCE.instanceUuid).value).toEqual({ warm: 1, cold: 1 })
})

it('has no stats for a source never connected to', () => {
  expect(runSourceStats(undefined).value).toBeUndefined()
})

it('has no stats while the VMs are loading', () => {
  vmCollectionMock.areVmsReady.value = false

  expect(runSourceStats(V2V_TEST_SOURCE.instanceUuid).value).toBeUndefined()
})

it('follows a source change', () => {
  vmCollectionMock.vms.value = [createV2vImportVm({ sourceId: 'vcenter-uuid-2' })]
  const sourceId = ref<string>(V2V_TEST_SOURCE.instanceUuid)
  const stats = runSourceStats(sourceId)

  sourceId.value = 'vcenter-uuid-2'

  expect(stats.value).toEqual({ warm: 1, cold: 0 })
})

it('follows a VM turning cold', () => {
  vmCollectionMock.vms.value = [createV2vImportVm({ isWarm: true })]
  const stats = runSourceStats(V2V_TEST_SOURCE.instanceUuid)

  vmCollectionMock.vms.value = [createV2vImportVm({ isWarm: false })]

  expect(stats.value).toEqual({ warm: 0, cold: 1 })
})
