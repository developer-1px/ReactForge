import {describe, expect, it} from "vitest"
import {createDraftProxy, createStorePart} from "./newStore.ts"

// -----------------------------------------------------------------------------------------------------
interface State {
  x: number
  y: number
  z: number
  sum: number

  arr: number[]
  computedArray: number[]

  count: number
  doubledCount: number

  foo: {
    bar: number
    baz: number
    nestedComputedArray: number[]
  }
}

interface Actions {
  INCREASE(by: number): void
  DECREASE(by: number): void
  RESET(): void
}

describe("proxy", () => {
  it("Computed", () => {
    const {store, reducer, snapshot} = createStorePart<State, Actions>()

    store.arr = [1, 2, 3]
    store.computedArray = reducer((state) => [])

    store.foo = {}
    store.foo.nestedComputedArray = reducer((state) => [])
  })
})
