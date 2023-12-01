import {createStore} from "../test/createStore.ts"

interface State {
  count: number
  doubledCount: number
}

interface Actions {
  INCREASE(by: number): void
  DECREASE(by: number): void
  RESET(): void
}

const {store, reducer} = createStore<State, Actions>()

store.count = reducer(0, (on) => {
  on.INCREASE((by) => (state) => (state.count += by))
  on.DECREASE((by) => (state) => (state.count -= by))
  on.RESET(() => (state) => (state.count = 0))
})

store.doubledCount = reducer((state) => state.count * 2)
