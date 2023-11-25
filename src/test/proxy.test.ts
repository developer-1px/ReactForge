import {describe, expect, it, vi} from "vitest"
import {createPathProxy, getValueFromPath, ReflectGet, ReflectSet} from "./createPathProxy.ts"

const isObject = (obj) => Object(obj) === obj

const isPrimitive = (value) => Object(value) !== value

const valueOf = <T>(value: T) => (typeof value?.valueOf === "function" ? value.valueOf() : value)

const makePathString = (path, prop) => [...path, prop].join(".")

// @FIXME: temp
const stateMutations = new Set()

const subscribeStateMutation = (callback) => {
  stateMutations.add(callback)
  return () => stateMutations.delete(callback)
}

const publishStateMutation = (...args) => {
  stateMutations.forEach((callback) => callback(...args))
}

const createStateProxy = <T>($store: T, $state: T, name?: string): [T, {value: number}, Set<any>] => {
  const deps = new Set()
  const version = {value: 0}

  const state = createPathProxy($state, () => {
    const get = (path) => (_, prop) => {
      const storeValue = ReflectGet(getValueFromPath($store, path), prop)
      if (storeValue instanceof Computed) {
        return storeValue.getValue()
      }

      const pathString = makePathString(path, prop)
      deps.add(pathString)
      console.log(name, ">>>> deps", pathString)

      let value = ReflectGet(getValueFromPath($state, path), prop)

      // @TODO

      return value
    }

    const set = (path) => (_, prop, value) => {
      // value = valueOf(value)

      // @TODO: 값이 달라지지 않았다면 return true

      // 그리고 한번에 Sync!

      // 변경사항 전파 draft에 먼저 값을 쓴다.

      const current = getValueFromPath($state, path)
      if (ReflectSet(current, prop, value)) {
        publishStateMutation($state, path, prop, value)
        return true
      }

      return false
    }

    return {get, set}
  }) as T

  const unsubscribe = subscribeStateMutation((target, path, prop) => {
    // if ($state !== $state) {
    //   return
    // }

    // version up!
    const pathString = makePathString(path, prop)
    if (deps.has(pathString)) {
      version.value++
      console.log(name, "version up!", version.value, pathString)
    }
  })

  return [state, version, deps, unsubscribe]
}

const createStoreProxy = <T>($store: T, $state: T): T => {
  const SET = (target, path, prop, valueFn) => {
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

  const store = createPathProxy($store, () => {
    const get = (path) => (_, prop) => {
      const current = getValueFromPath($store, path)
      return ReflectGet(current, prop) ?? {}
    }

    const set = (path) => (_, prop, value) => {
      const result = SET($store, path, prop, () => value)
      if (value instanceof Computed) {
        return result
      }
      SET($state, path, prop, (exist) => (exist === undefined ? value : exist))
      return result
    }

    return {get, set}
  }) as T

  return store
}

const createDraftProxy = <T>(state: T, draft: T = {}): T => {
  return createPathProxy(draft, () => {
    const get = (path) => (_, prop, receiver) => {
      const value = ReflectGet(getValueFromPath(draft, path), prop, receiver)
      if (value === undefined) {
        return ReflectGet(getValueFromPath(state, path), prop, receiver)
      }
      return value
    }

    const set = (path) => (_, prop, value, receiver) => {
      return ReflectSet(getValueFromPath(draft, path), prop, valueOf(value), receiver)
    }

    return {get, set}
  }) as T
}

/*
function MyType() {}

// 함수로 객체 생성
function createMyTypeInstance() {
    const instance = Object.create(MyType.prototype);
    // 필요한 경우 여기에서 초기화 코드 추가
    return instance;
}

const myInstance = createMyTypeInstance();
console.log(myInstance instanceof MyType); // true

[참고용 코드]
 */

// @FIXME: 이걸 꼭 클래스로 만들필요가 있었을까??
class Computed<State, T> {
  public value: T | undefined
  public version = {value: NaN}
  public lastVersion = -1
  public state
  public _unsubscribe: () => void

  constructor(
    public $store: State,
    public $state: State,
    public computedFn: (state: State) => T
  ) {
    const [state, version, deps, unsubscribe] = createStateProxy(this.$store, this.$state, "computed!")
    this.state = state
    this.version = version
    this.value = undefined
    this._unsubscribe = unsubscribe

    // @TODO: unsubscribe 언제?? 어떻게?
  }

  getValue() {
    if (this.lastVersion !== this.version.value) {
      this.value = this.computedFn(this.state)
      this.lastVersion = this.version.value
    }
    return this.value
  }

  unsubscribe() {
    this._unsubscribe()
  }
}

type Init<State, T> = ((state: State) => T) | T
type On<Actions, State> = {[K in keyof Actions]: (fn: (state: State) => Actions[K]) => void}
type ReducerFn<State, Actions> = (on: On<Actions, State>) => void

// @FIXME: 임시로 interface만 맞춰봄.
const createStore = <State, Actions>() => {
  const $store = {} as State
  const $state = {} as State

  // @FIXME: 임시로 interface만 맞춰봄.
  const reducer = <T>(init: Init<State, T>, fn?: ReducerFn<State, Actions>) => {
    return new Computed($store, $state, init) as T
  }

  const store = createStoreProxy<State>($store, $state)

  expect(store === $store).toBe(false)
  expect(store.valueOf() === $store).toBe(true)

  const createState = (name: string) => createStateProxy<State>($store, $state, name)

  return {store, reducer, createState, $store, $state}
}

//-----------------------------------------------------------------------------------------------------
interface State {
  x: number
  y: number
  sum: number
  count: number

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
  it("Store, State, Computed", () => {
    const {store, reducer, createState, $store, $state} = createStore<State, Actions>()

    const [state, version, deps] = createState("root")
    const [state2, version2, deps2] = createState("root2")

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

    store.count = reducer(0, (on) => {
      on.INCREASE((state) => (by) => (state.count += by))
      on.DECREASE((state) => (by) => (state.count += by))
      on.RESET((state) => () => (state.count = 0))
    })
  })
})
