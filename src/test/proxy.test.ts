import {describe, expect, it} from "vitest"
import {createDraftProxy, createStorePart} from "./createStore.ts"

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
  const {store, reducer, createState, $store, $state} = createStorePart<State, Actions>()

  const [state] = createState("root")
  const [state2] = createState("root2")

  it("Store.md, State, Computed", () => {
    return

    // Store는 undefined라도 path를 어떻게든 설정할 수 있다.
    store.foo.bar = 200

    // Store에 보관된 값은 모든 state의 시작값이 되어줌.
    expect(store.foo.bar).toBe(200)
    expect($store.foo.bar).toBe(200)
    expect($state.foo.bar).toBe(200)
    expect(state.foo.bar).toBe(200)
    expect(state2.foo.bar).toBe(200)

    // state는 경로 중에 undefined면 에러남.
    // @TODO: throw test

    //
    state.x = 100
    state2.y = 1

    expect(state.x).toBe(100)
    expect(state2.x).toBe(100)
    expect($state.x).toBe(100)

    // state의 변화가 store 값에 영향을 주지는 않는다.
    expect(store.x).not.toBe(100)

    // Store에 Computed 함수를 설정할 수 있다.
    // Computed Test
    store.sum = reducer((state) => state.x + state.y)

    expect(state.sum).toBe(101)

    state.x = 200
    expect(state.sum).toBe(201)

    // @TODO: test. computed call은 값이 바뀌지 않으면 발생하지 않는다.
    expect(state.sum).toBe(201)

    state.x = 50
    expect(state.sum).toBe(51)
  })

  it("Computed", () => {
    store.arr = [1, 2, 3]
    store.computedArray = reducer((state) => [])
    store.foo.nestedComputedArray = reducer((state) => [])

    // expect([].map).toBe([].map)
    // expect([].map).toBe(state.arr.map)

    console.log("22222", [].map)

    console.log(
      ".>>>>>>>>>>>>>>>>>>>>>>",
      state.arr.map((x) => x * 2)
    )

    // nestedComputedArray
  })

  it("Draft Test", () => {
    return

    const {store, reducer, createState, $store, $state} = createStorePart<State, Actions>()

    const [state] = createState("state1")

    store.sum = reducer((state) => state.x + state.y)

    state.x = 100
    state.y = 200
    state.foo = {bar: 300, baz: 400}

    expect(state.x).toBe(100)
    expect(state.y).toBe(200)
    expect(state.sum).toBe(300)
    expect(state.foo.bar).toBe(300)

    // Draft는 생성 당시 state의 값을 그대로 출력한다.
    const {draft, commit} = createDraftProxy($store, $state)
    const {draft: draft2, commit: commit2} = createDraftProxy($store, $state)

    const initialX = draft.x

    expect(draft.x).toBe(100)
    expect(draft.y).toBe(200)
    expect(draft.foo.bar).toBe(300)

    expect(draft2.x).toBe(100)
    expect(draft2.y).toBe(200)
    expect(draft2.foo.bar).toBe(300)

    // draft는 항상 원본의 복사본을 가르킨다.
    expect(state.foo).not.toBe(draft.foo)
    expect(draft.foo).toBe(draft.foo)

    // Draft의 값을 변경하면 Draft에만 영향을 받고 원본은 그대로 유지된다.
    draft.y += 100
    draft.foo.bar += 100

    console.log("state", state)
    console.log("draft", draft)
    console.log("draft.y", draft.y)

    expect(draft.x).toBe(100)
    expect(draft.y).toBe(300)
    expect(draft.foo.bar).toBe(400)

    expect(state.y).toBe(200)
    expect(state.y).toBe(200)
    expect(state.foo.bar).toBe(300)

    expect(draft.y).toBe(300)
    expect(draft.foo.bar).toBe(400)

    // Draft는 생성 당시 state의 값을 그대로 유지하기 때문에 State가 변경해도 Draft의 값은 변화가 없다.
    state.x = 200

    expect(state.x).toBe(200)
    expect(draft.x).toBe(100)

    // draft는 생성 당시 state의 값을 계속 가지게 된다. 불변성 유지
    expect(draft.x).not.toBe(state.x)
    expect(draft.x).toBe(initialX)

    commit()

    // 커밋을 해도 draft는 생성 당시 state의 값을 계속 가지게 된다. 불변성 유지
    expect(draft.x).not.toBe(state.x)
    expect(draft.x).toBe(initialX)

    //
    expect(state.y).toBe(draft.y)
    expect(state.foo.bar).toBe(draft.foo.bar)
    expect(state.foo.baz).toBe(draft.foo.baz)
    expect(state.foo.baz).toBe(400)

    // 아무 변화가 없던 Draft2가 commit이 되어도 변화가 없다.
    commit2()

    expect(draft.x).not.toBe(state.x)
    expect(draft.x).toBe(initialX)

    expect(state.foo.bar).toBe(draft.foo.bar)
    expect(state.foo.baz).toBe(draft.foo.baz)
    expect(state.foo.baz).toBe(400)
  })
})
