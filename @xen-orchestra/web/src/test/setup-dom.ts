import { enableAutoUnmount } from '@vue/test-utils'

// happy-dom keeps the local storage across the tests of a file: each test starts with an empty one
beforeEach(() => {
  localStorage.clear()
})

enableAutoUnmount(afterEach)
