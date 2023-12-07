import {describe, expect, it} from "vitest"
import {createStorePart} from "./newStore.ts"

interface State {
  x: number
  y: number
  sum: number

  count: number
  doubledCount: number

  foo: {
    bar: number
    baz: number
  }
}

interface Actions {
  INCREASE(by: number): void
  DECREASE(by: number): void
  RESET(): void
}

describe("reducer", () => {
  it("reducer Counter", () => {
    return

    const {store, reducer, createState, dispatch} = createStorePart<State, Actions>()
    const [state] = createState("counter")

    store.count = reducer(0, (on) => {
      on.INCREASE((by) => (state) => (state.count += by))
      on.DECREASE((by) => (state) => (state.count -= by))
      on.RESET(() => (state) => (state.count = 0))
    })

    store.doubledCount = reducer((state) => state.count * 2)

    expect(state.count).toBe(0)
    expect(state.doubledCount).toBe(0)

    dispatch.INCREASE(1)
    expect(state.count).toBe(1)
    expect(state.doubledCount).toBe(state.count * 2)

    dispatch.INCREASE(5)
    expect(state.count).toBe(6)
    expect(state.doubledCount).toBe(state.count * 2)

    dispatch.DECREASE(2)
    expect(state.count).toBe(4)
    expect(state.doubledCount).toBe(state.count * 2)

    dispatch.RESET()
    expect(state.count).toBe(0)
    expect(state.doubledCount).toBe(state.count * 2)
  })
})
