import {describe, expect, it} from "vitest"
import {createDraftProxy, createStorePart} from "./newStore.ts"

describe("Draft Test", () => {
  it("Draft Test", () => {
    const {store, reducer} = createStorePart()
    const state = store

    store.sum = reducer((state) => state.x + state.y)

    state.x = 100
    state.y = 200
    state.foo = {bar: 300, baz: 400}

    console.log("@@@", store)
    console.log("sum", store.sum)

    expect(state.x).toBe(100)
    expect(state.y).toBe(200)
    expect(state.sum).toBe(300)
    expect(state.foo.bar).toBe(300)

    // Draft는 생성 당시 state의 값을 그대로 출력한다.
    const draft = createDraftProxy(store)
    const draft2 = createDraftProxy(store)

    expect(draft.x).toBe(100)
    expect(draft.y).toBe(200)
    expect(draft.foo.bar).toBe(300)

    expect(draft2.x).toBe(100)
    expect(draft2.y).toBe(200)
    expect(draft2.foo.bar).toBe(300)

    // draft의 값이 바뀐다고 다른 state나 draft의 값이 바뀌지는 않는다.
    draft.x = 10
    expect(draft.x).toBe(10)
    expect(draft2.x).toBe(100)
    expect(state.x).toBe(100)

    // 원본 state의 값이 바뀌어도 draft의 값은 유지된다.
    state.x = 50
    expect(draft.x).toBe(10)

    // 단, draft의 값을 수정하지 않았다면 기존 draft는 state의 값을 따라간다.
    expect(draft2.x).toBe(50)

    console.log({draft})
    console.log({draft2})
  })
})

describe("[new] Store와 리듀서", () => {
  it("Store와 Computed Value Reducer", () => {
    const {store, reducer} = createStorePart()

    // store에 작성한 값은 바로 사용할 수 있다.
    store.x = 100
    expect(store.x).toBe(100)

    // store에 작성된 reducer의 값은 store에 반영된다.
    store.y = reducer(50)
    expect(store.y).toBe(50)

    // store에 작성된 reducer의 값은 computedValue는 store에 반영된다.
    store.doubledX = reducer((state) => state.x * 2)
    expect(store.doubledX).toBe(200)

    // computed Value는 연속해서 접근할 수 있다.
    store.sum = reducer((state) => state.doubledX + state.y)
    expect(store.sum).toBe(250)

    // 값이 변경되면 computed Value에도 반영이 된다.
    store.x = 25
    expect(store.x).toBe(25)
    expect(store.doubledX).toBe(50)
    expect(store.sum).toBe(100)

    // 값이 변경되면 computed Value에도 반영이 된다.
    store.y = 100
    expect(store.y).toBe(100)
    expect(store.doubledX).toBe(50)
    expect(store.sum).toBe(150)
  })

  it("Store와 Array", () => {
    const {store, reducer} = createStorePart()

    // store에 array가 가능하다.
    store.arr = [1, 2, 3]
    expect(store.arr).toEqual([1, 2, 3])

    // Array의 map과 같은 네이티브값을 써도 문제가 없다.
    store.arr2 = store.arr.map((x) => x * 2)
    expect(store.arr2).toEqual([2, 4, 6])

    // Array의 map과 같은 네이티브값을 써도 문제가 없다.
    store.arr3 = reducer(() => [1, 2])
    expect(store.arr3).toEqual([1, 2])

    store.arr4 = reducer((state) => state.arr3.map((x) => x * 3))
    expect(store.arr4).toEqual([3, 6])
  })

  it("Reducer와 dispatch", () => {
    const {store, reducer, dispatch, snapshot} = createStorePart()

    store.count = reducer(0, (on) => {
      on.INCREASE((by) => (state) => (state.count += by))
      on.DECREASE((by) => (state) => (state.count -= by))
      on.RESET(() => (state) => (state.count = 0))
    })

    store.doubledCount = reducer((state) => state.count * 2)

    const [state] = snapshot()

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

  it("Snapshot", () => {
    const {store, reducer, dispatch, snapshot} = createStorePart()

    store.count = reducer(0, (on) => {
      on.INCREASE((by) => (state) => (state.count += by))
      on.DECREASE((by) => (state) => (state.count -= by))
      on.RESET(() => (state) => (state.count = 0))
    })

    store.test = reducer(0, (on) => {
      on.INCREASE(() => (state) => state.test++)
    })

    store.doubledCount = reducer((state) => state.count * 2)

    store.foo = {}
    store.foo.bar = 200

    const [state, subscribe, marked] = snapshot()

    console.log("markedmarked", marked)

    // console.log("#", state.test)
    // console.log("#", state.count)
    // console.log("#", state.foo.bar)
    console.log("#", state.doubledCount)

    console.log("markedmarked", marked)

    dispatch.INCREASE(1)
    // dispatch.DECREASE(1)
    // dispatch.RESET()

    console.log("markedmarked", marked)

    console.log(state.doubledCount)

    dispatch.INCREASE(1)

    console.log(state.doubledCount)

    dispatch.INCREASE(1)

    console.log(state.doubledCount)
  })
})
