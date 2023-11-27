import {describe, expect, it, vi} from "vitest"
import {createPathProxy, getValueFromPath, ReflectGet, ReflectSet} from "./createPathProxy.ts"

const isObject = (obj: unknown) => Object(obj) === obj

const isPrimitive = (value: unknown) => Object(value) !== value

const valueOf = <T>(value: T) => (typeof value?.valueOf === "function" ? value.valueOf() : value)

const makePathString = (path: string[], prop: string) => [...path, prop].join(".")

const traverseObject = <T extends object>(obj: T, callback: (path: string[], prop: string, value: any) => void, path: string[] = []) => {
  if (!isObject(obj)) {
    return
  }

  Object.entries(obj).forEach(([key, value]) => {
    const currentPath = [...path, key]
    callback(path, key, value)
    if (isObject(value)) {
      traverseObject(value, callback, currentPath)
    }
  })
}

const safeReflectGet = <T>(target: object, path: string[], prop: string): T | undefined => {
  const current = getValueFromPath(target, path)
  return ReflectGet(current, prop)
}

const safeReflectSet = (target: object, path: string[], prop: string, valueFn: (exist: unknown) => unknown) => {
  path.forEach((p) => {
    let next = ReflectGet(target, p)
    if (!next) {
      next = {}
      ReflectSet(target, p, next)
    }
    target = next
  })
  return ReflectSet(target, prop, valueFn(ReflectGet(target, prop)))
}

//
//
// --- StoreProxy

const createStoreProxy = <T extends object>($store: T, $state: T): T => {
  const store = createPathProxy($store, () => {
    const get = (path) => (_, prop) => safeReflectGet($store, path, prop) ?? {}

    const set = (path) => (_, prop, value) => {
      const result = safeReflectSet($store, path, prop, () => value)

      // @TODO: @fixme!! 리듀서에게 위임하기?
      if (value instanceof Reducer) {
        if (value.computed) {
          return result
        }
        value = value.initValue
      }

      // @TODO: 아래 코드 설명 필요!
      safeReflectSet($state, path, prop, (exist) => (exist === undefined ? value : exist))
      return result
    }

    return {get, set}
  }) as T

  return store
}

const getComputedValueFromStore = ($store: object, path: string[], prop: string) => {
  const storeValue = safeReflectGet($store, path, prop)
  if (storeValue instanceof Reducer) {
    if (storeValue.computed) {
      return [true, storeValue.computed.getValue()] as const
    }
  }
  return [false, undefined] as const
}

//
//
/// --- StateProxy

type SubscribeCallback = (...args: unknown[]) => void
const stateMutations = new Set<SubscribeCallback>()

const subscribeStateMutation = (callback: SubscribeCallback) => {
  stateMutations.add(callback)
  return () => stateMutations.delete(callback)
}

const publishStateMutation = (...args: unknown[]) => {
  stateMutations.forEach((callback) => callback(...args))
}

const createStateProxy = <T extends object>($store: T, $state: T, name: string = "") => {
  const deps = new Set<string>()
  const version = {value: 0}

  const state = createPathProxy($state, () => {
    const get = (path: string[]) => (_, prop) => {
      const [hasStoreValue, storeValue] = getComputedValueFromStore($store, path, prop)
      if (hasStoreValue) {
        return storeValue
      }

      // 변화추적을 위해 사용되고 있는 path 기록
      const pathString = makePathString(path, prop)
      deps.add(pathString)

      //
      const value = safeReflectGet($state, path, prop)

      // @TODO: Array라면???

      // push, pop,

      return value
    }

    const set = (path: string[]) => (_, prop, value) => {
      const current = getValueFromPath($state, path)
      const existValue = ReflectGet(current, prop)

      // 값은 값이라면 업데이트 하지 않는다.
      if (existValue === value) {
        return true
      }

      if (ReflectSet(current, prop, value)) {
        publishStateMutation($state, path, prop, value, existValue)
        return true
      }
      return false
    }

    return {get, set}
  }) as T

  const unsubscribe = subscribeStateMutation((target, path, prop, value) => {
    if ($state !== target) {
      return
    }

    // version up!
    const pathString = makePathString(path, prop)
    if (deps.has(pathString)) {
      version.value++
      console.log(`[state:${name}] v${version.value}`, pathString, "→", value)
    }
  })

  return [state, unsubscribe, version, deps] as const
}

const createDraftProxy = <T>($store: T, $state: T) => {
  let $draft_store: T = {} as T

  let $draft_read: T = {} as T
  let $draft: T = {} as T

  const draft = createPathProxy($draft, () => {
    const get = (path) => (_, prop) => {
      //
      // @FIXME
      const [hasStoreValue, storeValue] = getComputedValueFromStore($draft_store, path, prop)
      if (hasStoreValue) {
        return storeValue
      }

      const reducer = safeReflectGet($store, path, prop)
      if (reducer) {
        const newReducer = reducer.clone($draft_store)
        safeReflectSet($draft_store, path, prop, () => newReducer)
        return getComputedValueFromStore($draft_store, path, prop)[1]
      }

      //
      let value = safeReflectGet($draft, path, prop)
      value = value === undefined ? safeReflectGet($draft_read, path, prop) : value
      if (value === undefined) {
        value = safeReflectGet($state, path, prop)
        if (Array.isArray(value)) value = [...value]
        else if (isObject(value)) value = {...value}
      }
      return value
    }

    const set = (path) => (_, prop, value) => safeReflectSet($draft, path, prop, () => valueOf(value))

    return {get, set}
  }) as T

  // 불변성을 유지하기 위해서 새로운 값이 바뀌면 draft는 이전 값을 유지한다.
  const unsubscribe = subscribeStateMutation((target, path, prop, _, existValue) => {
    if ($state !== target) {
      return
    }

    const draftValue = safeReflectGet($draft, path, prop)
    if (draftValue === undefined) {
      ReflectSet(getValueFromPath($draft_read, path), prop, valueOf(existValue))
    }
  })

  const commit = () => {
    const [state, unsubscribe] = createStateProxy($store, $state, "commit")

    traverseObject($draft, (path, prop, value) => {
      if (isPrimitive(value)) {
        safeReflectSet(state, path, prop, () => value)
      }
    })

    $draft_read = {} as T
    $draft = {} as T
    unsubscribe()
  }

  return {draft, commit, unsubscribe}
}

// Computed
type Computed<T> = {
  getValue: () => T | undefined
  unsubscribe: () => void
}

const createComputed = <State, T>($store: State, $state: State, computedFn: (state: State) => T): Computed<T> => {
  let value: T | undefined = undefined
  let lastVersion = -1

  const [state, unsubscribe, version] = createStateProxy($store, $state, "computed")

  const getValue = (): T | undefined => {
    if (lastVersion !== version.value) {
      value = computedFn(state)
      lastVersion = version.value
    }
    return value
  }

  return {getValue, unsubscribe}
}

// Reducer
type Init<State, T> = ((state: State) => T) | T
type On<Actions, State> = {[K in keyof Actions]: (fn: (state: State) => Actions[K]) => void}
type ReducerFn<State, Actions> = (on: On<Actions, State>) => void

class Reducer<State, Actions, T> {
  public initValue: T | undefined
  public computed: Computed<T> | undefined

  constructor(
    public init: Init<State, T>,
    public reducerFn: ReducerFn<State, Actions>,
    public $store: State,
    public $state: State
  ) {
    this.initValue = typeof init !== "function" ? init : undefined
    this.computed = typeof init === "function" ? createComputed($store, $state, init) : undefined
  }

  clone($store: State) {
    return new Reducer<State, Actions, T>(this.init, this.reducerFn, $store, this.$state)
  }
}

// @FIXME: 임시로 interface만 맞춰봄.
export const createStore = <State, Actions>() => {
  const $store = {} as State
  const $state = {} as State

  const noop = () => {}

  const store = createStoreProxy<State>($store, $state)

  const reducer = <T>(init: Init<State, T>, fn: ReducerFn<State, Actions> = noop) => {
    return new Reducer(init, fn, $store, $state)
  }

  const createState = (name: string) => createStateProxy<State>($store, $state, name)

  // createDispatch
  const $dispatch = (type: string, args: unknown[]) => {
    const {draft, commit, unsubscribe} = createDraftProxy($store, $state)

    const on = new Proxy(Function, {
      get: (_, handlerType: string) => (fn: Function) => {
        if (handlerType === type) {
          // @TODO: state에 뭔가를 추적을 할 수 있는 것들을 넣으면 좋겠는데...
          const result = fn(draft)(...args)

          // @TODO: reuslt 비동기처리
        }
      },
      apply(_, thisArg, argumentsList) {
        //TODO
      },
    }) as On<Actions, State>

    // reduce 실행
    traverseObject(store, (path, prop, value) => {
      const reducer = value
      if (reducer instanceof Reducer) {
        reducer.reducerFn(on)
      }
    })

    commit()
    unsubscribe()
  }

  const dispatch = new Proxy(Function, {
    get:
      (_, type: string) =>
      (...payload: unknown[]) => {
        // console.group(type + "(", ...payload, ")")
        // console.groupCollapsed("(callstack)")
        // console.trace("")
        // console.groupEnd()
        console.log("[dispatch]", type, ...payload)
        $dispatch(type, payload)
        // console.groupEnd()

        // snapshot = createStateProxy(originalStore, root, dirtySet)
        // window.state = snapshot
      },
  }) as Actions

  return {store, reducer, createState, dispatch, $store, $state}
}

//-----------------------------------------------------------------------------------------------------
interface State {
  x: number
  y: number
  z: number
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

describe("proxy", () => {
  const {store, reducer, createState, $store, $state} = createStore<State, Actions>()
  const [state] = createState("root")
  const [state2] = createState("root2")

  it("Store, State, Computed", () => {
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

  it("Draft Test", () => {
    const {store, reducer, createState, $store, $state} = createStore<State, Actions>()

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

    expect(draft.x).toBe(100)
    expect(draft.y).toBe(200)
    expect(draft.foo.bar).toBe(300)

    expect(draft2.x).toBe(100)
    expect(draft2.y).toBe(200)
    expect(draft2.foo.bar).toBe(300)

    // Draft의 값을 변경하면 Draft에만 영향을 받고 원본은 그대로 유지된다.
    draft.y += 100
    draft.foo.bar += 100

    console.log("draft.sum", draft.sum)

    expect(state.y).toBe(200)

    expect(state.y).toBe(200)
    expect(state.foo.bar).toBe(300)

    expect(draft.y).toBe(300)
    expect(draft.foo.bar).toBe(400)

    // Draft는 생성 당시 state의 값을 그대로 유지하기 때문에 State가 변경해도 Draft의 값은 변화가 없다.
    state.x = 200
    expect(state.x).toBe(200)
    expect(draft.x).toBe(100)

    // commit을 하면 state의 값과 draft의 값이 같아진다.
    commit()

    expect(state.x).toBe(draft.x)
    expect(state.y).toBe(draft.y)
    expect(state.foo.bar).toBe(draft.foo.bar)
    expect(state.foo.baz).toBe(draft.foo.baz)
    expect(state.foo.baz).toBe(400)

    // 아무 변화가 없던 Draft2가 commit이 되어도 변화가 없다.
    commit2()

    expect(state.x).toBe(draft.x)
    expect(state.y).toBe(draft.y)
    expect(state.foo.bar).toBe(draft.foo.bar)
    expect(state.foo.baz).toBe(draft.foo.baz)
    expect(state.foo.baz).toBe(400)
  })
})
