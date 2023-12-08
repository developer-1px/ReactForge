import {describe, expect, it, vi} from "vitest"
import {createStorePart} from "./newStore.ts"

interface State {
  count: number
  doubledCount: number
  onlyUp: number
  doubledOnlyUp: number
}

interface Actions {
  INCREASE(by: number): void
  DECREASE(by: number): void
  RESET(): void
}

describe.only("reducer", () => {
  it("reducer Counter", () => {
    const {store, reducer, dispatch, snapshot} = createStorePart<State, Actions>()

    store.count = reducer(0, (on) => {
      on.INCREASE((by) => (state) => (state.count += by))
      on.DECREASE((by) => (state) => (state.count -= by))
      on.RESET(() => (state) => (state.count = 0))
    })

    store.onlyUp = reducer(0, (on) => {
      on.INCREASE((by) => (state) => (state.onlyUp += by))
    })

    const computedDoubledCount = vi.fn((state) => state.count * 2)
    const computedDoubledOnlyUp = vi.fn((state) => state.onlyUp * 2)

    store.doubledCount = reducer(computedDoubledCount)

    store.doubledOnlyUp = reducer(computedDoubledOnlyUp)

    //
    const [state] = snapshot()

    expect(state.count).toBe(0)
    // expect(state.doubledCount).toBe(0)
    // expect(state.doubledCount).toBe(0)
    // expect(state.doubledCount).toBe(0)
    // console.log(state)

    // expect(computedDoubledCount).toBeCalledTimes(1)
    // expect(computedDoubledOnlyUp).toBeCalledTimes(0)

    dispatch.INCREASE(1)
    // expect(state.count).toBe(1)
    // expect(state.onlyUp).toBe(1)
    // expect(state.doubledCount).toBe(2)

    // // expect(computedDoubledCount).toBeCalledTimes(2)
    // // expect(computedDoubledOnlyUp).toBeCalledTimes(1)
    //
    // dispatch.INCREASE(5)
    // expect(state.count).toBe(6)
    // expect(state.onlyUp).toBe(6)
    // expect(state.doubledCount).toBe(12)
    //
    // dispatch.DECREASE(2)
    // expect(state.count).toBe(4)
    // expect(state.onlyUp).toBe(6)
    // expect(state.doubledCount).toBe(8)
    //
    // dispatch.RESET()
    // expect(state.count).toBe(0)
    // expect(state.onlyUp).toBe(6)
    // expect(state.doubledCount).toBe(0)

    // expect(computedDoubledCount).toBeCalledTimes(1)
    // expect(computedDoubledCount).toBeCalledTimes(1)
  })
})
