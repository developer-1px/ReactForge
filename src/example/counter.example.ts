import {dispatch, reducer, store} from "../libs/proxy/newStore.ts"

store.count = reducer(0, (on) => {
  on.INCREASE((state) => (by) => (state.count += by))

  on.DECREASE((state) => (by) => (state.count -= by))

  on.RESET((state) => () => (state.count = 0))
})

// Store를 받아라... 차라리..

// createStoreComponent 고민해보기!!!

// 아래는 실패작들...
const createCounter = () =>
  reducer(0, (on) => {
    on.INCREASE((set) => (by) => set((count) => count + by))

    on.DECREASE((set) => (by) => set((count) => count + by))

    on.RESET((set) => () => set(0))
  })

store.count = createCounter("count")

store.count2 = createCounter("count2")

store.counts = reducer({}, (on) => {
  on.INCREASE((state) => (id, by) => (state.counts[id] += by))

  on.DECREASE((state) => (id, by) => (state.counts[id] -= by))

  on.RESET((state) => (id) => (state.counts[id] = 0))
})

dispatch.INCREASE(id, 10)
