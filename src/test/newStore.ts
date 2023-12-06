import {useEffect, useMemo, useRef, useState} from "react"

export const isObject = (target: unknown): target is object => Object(target) === target

//
//
// Store
// --------------------------------------------------------------------
const nonProxyTypes = [Function, Date, RegExp, Set, Map, WeakSet, WeakMap, Error, ArrayBuffer, globalThis.Node]
const isProxiable = (target: unknown): target is object => isObject(target) && !nonProxyTypes.some((type) => type && target instanceof type)
const proxiedObjects = new Map<object, object>()

const createCachedProxy = <T extends object>(obj: T, handler: ProxyHandler<T>) => {
  if (!isProxiable(obj)) return obj
  if (proxiedObjects.has(obj)) return proxiedObjects.get(obj) as T
  const proxy = new Proxy(obj, handler)
  proxiedObjects.set(obj, proxy)
  return proxy
}

const registerPrototype = (target: object) => {
  let proto = Object.getPrototypeOf(target)
  proto = proto === Object.prototype ? {} : proto
  Object.setPrototypeOf(target, proto)
  return proto
}

// createStoreProxy(): 상태 관리를 위한 Proxy를 생성합니다. 상태 객체의 속성 접근과 변경을 감시하며, Reducer를 통해 계산된 값을 관리합니다.
function createStoreProxy<State extends object>(obj: State | object, root: State): State {
  return createCachedProxy(obj, {
    get(target, prop, receiver) {
      // Reducer: Computed Value 처리
      const reducer = Object.getPrototypeOf(target)[prop]
      if (reducer instanceof Reducer && reducer.computed) {
        const state = createStoreProxy(root, root)
        const result = reducer.computed(state)
        return createStoreProxy(result, root)
      }

      const result = Reflect.get(target, prop, receiver)
      return createStoreProxy(result, root)
    },

    // store.id = key
    // store.val = value
    // store.count = reducer(0, {...})
    set(target, prop, value, receiver) {
      // set reducer
      if (value instanceof Reducer) {
        // register Reducer
        const reducer = value
        const proto = registerPrototype(target)
        proto[prop] = reducer

        // Computed Getter
        if (reducer.computed) {
          const state = createStoreProxy(root, root)
          Object.defineProperty(proto, prop, {get: () => reducer.computed(state)})
          return true
        }

        // init Reducer value
        return Reflect.set(target, prop, reducer.value, receiver)
      }

      const currentValue = Reflect.get(target, prop, receiver)
      if (Object.is(currentValue, value)) {
        return true
      }

      const proto = registerPrototype(target)
      proto[VERSION] = proto[VERSION] || {}
      proto[VERSION][prop] = (proto[VERSION][prop] || 0) + 1
      return Reflect.set(target, prop, value, receiver)
    },
  }) as State
}

//
//
// Draft
// -----------------------------------------------------------------------
const createDraftProxyPath = (obj: object): object => {
  if (!isProxiable(obj)) return obj
  return new Proxy(obj, {
    get(target, prop, receiver) {
      if (Reflect.getOwnPropertyDescriptor(target, prop)) {
        return createDraftProxyPath(Reflect.get(target, prop, receiver))
      }

      let result = Reflect.get(target, prop, receiver)
      if (isObject(result)) {
        result = Object.create(result)
        Reflect.set(target, prop, result, receiver)
      }

      return createDraftProxyPath(result)
    },

    deleteProperty(target, prop) {
      return Reflect.set(target, prop, undefined)
    },
  }) as object
}

export function createDraftProxy<State extends object>(store: State): State {
  return createDraftProxyPath(Object.create(store)) as State
}

//
//
// Reducer
// -----------------------------------------------------------------------
type Selector<State, T> = (state: State) => T
type Init<State, T> = T | Selector<State, T>

type MutateFn<State, Actions> = (state: State, dispatch: Actions) => void | unknown | Promise<unknown>
type On<Actions, State> = {
  [K in keyof Actions]: (fn: (...args: Actions[K] extends (...args: infer P) => unknown ? P : never[]) => MutateFn<State, Actions>) => void
}
type ReducerFn<State, Actions> = (on: On<Actions, State>) => void

const noop = () => {}

class Reducer<State extends object, Actions, T> {
  public value: T | undefined
  public computed: (state: State) => T

  constructor(
    public init: Init<State, T>,
    public reducerFn: ReducerFn<State, Actions>
  ) {
    this.value = typeof init !== "function" ? init : undefined
    this.computed = typeof init === "function" ? init : undefined
  }
}

//
//
// Snapshot
// ----------------------------------------------------------------
const VERSION = Symbol("@version")

const compareSnapshotKey = (obj1: Record<string, unknown>, obj2: Record<string, unknown>) => {
  const keys1 = Object.keys(obj1)
  for (const key of keys1) if (obj1[key] !== obj2[key]) return false
  return true
}

function createSnapshot<State extends object>(store: State) {
  const marked = new Map<Record<string, number>, Record<string, number>>()

  const snapshot = new Proxy(store, {
    get(target, prop, receiver) {
      const proto = Object.getPrototypeOf(target)
      const versionMap = proto[VERSION]
      if (versionMap && typeof prop === "string") {
        const lastVersions = marked.get(versionMap) || {}
        lastVersions[prop] = versionMap[prop]
        marked.set(versionMap, lastVersions)
      }
      return Reflect.get(target, prop, receiver)
    },
  }) as State

  const callBackSet = new Set()

  const handler = (...args) => {
    // once!!
    console.log("subscribeMutation", ...args, callBackSet)

    for (const [key, snapshotKeys] of marked) {
      console.log("check!!", key, snapshotKeys)

      if (!compareSnapshotKey(snapshotKeys, key)) {
        callBackSet.forEach((cb) => cb(snapshotKeys))
        Object.keys(snapshotKeys).forEach((prop) => (snapshotKeys[prop] = key[prop]))
        break
      }
    }
  }

  const subscribe = (callback: Function) => {
    const unsubscribe = subscribeMutation(handler)
    callBackSet.add(callback)
    return () => {
      callBackSet.delete(callback)
      if (callBackSet.size === 0) unsubscribe()
    }
  }

  return [snapshot, subscribe, marked] as const
}

//
//
// Dispatcher
// ----------------------------------------------------------------
type Dispatch<Actions> = Actions & ((type: string, ...payload: unknown[]) => void)

const traverseReducer = <T extends object>(
  obj: T,
  callback: (value: unknown, path: string[], prop: string) => void | false,
  path: string[] = []
) => {
  if (!isObject(obj)) {
    return
  }

  Object.entries(Object.getPrototypeOf(obj)).forEach(([key, value]) => {
    const currentPath = [...path, key]
    const res = callback(value, path, key)
    if (res !== false && isObject(value)) {
      traverseReducer(value, callback, currentPath)
    }
  })
}

const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>) => {
  Object.keys(source).forEach((key) => {
    if (isObject(source[key])) {
      target[key] = target[key] || {}
      deepMerge(target[key], source[key])
    } else {
      target[key] = source[key]
    }
  })
  return target
}

const createOn = <State, Actions>(type: string, payload: unknown[], draft: State, dispatch: Dispatch<Actions>) => {
  return new Proxy(Function, {
    get: (_, actionType: string) => (fn: (...args: unknown[]) => MutateFn<State, Actions>) => {
      if (actionType === type) {
        // @TODO: fn이 function이 아니라 값이라면 바로 값을 넣어 줄 수 있다.
        if (typeof fn !== "function") {
          // @TODO: drfat[prop] = fn
          // @TODO: 그럴려면 prop이름을 store.reducer에서 알 수 있어야 한다.
        }

        // @TODO: state에 뭔가를 추적을 할 수 있는 것들을 넣으면 좋겠는데...
        const result = fn(...payload)(draft, dispatch)

        // @TODO: reuslt 비동기처리
      }
    },

    apply(_, __, argumentsList) {
      //TODO
      console.log(argumentsList)
    },
  }) as On<Actions, State>
}

const mutationCallbackSet = new Set()

const subscribeMutation = (callback: Function) => {
  mutationCallbackSet.add(callback)
  return () => mutationCallbackSet.delete(callback)
}

const publishMutaion = (...args) => {
  mutationCallbackSet.forEach((cb) => cb(...args))
}

function createDispatch<State extends object, Actions>(store: State, options) {
  const defaultOptions = {}
  options = {...defaultOptions, ...options}
  const middleware = options.middleware

  const dispatchAction = (type: string, payload: unknown[]) => {
    const stateChanges = {}

    // reduce 실행
    traverseReducer(store, (reducer, path, prop) => {
      if (reducer instanceof Reducer) {
        const draft = createDraftProxy(store)
        const on = createOn<State, Actions>(type, payload, draft, dispatch)
        reducer.reducerFn(on)
        deepMerge(stateChanges, draft)
        return false
      }
    })

    deepMerge(store, stateChanges)
    publishMutaion(store, stateChanges)
  }

  const next = ({type, payload}) => dispatchAction(type, payload)

  const dispatch = new Proxy(Function, {
    get(_, type: string) {
      return (...payload: unknown[]) => {
        const action = {type, payload}
        middleware({dispatch, getState: () => store})(next)(action)
      }
    },
    apply(_, thisArg, argumentsList) {
      //TODO
      const [type, ...payload] = argumentsList
      return dispatch[type](...payload)
    },
  }) as Dispatch<Actions>

  return dispatch
}

//
//
// UseStore for React
// ----------------------------------------------------------------------------------------------
type UseStore<State, Actions> = Readonly<State> & {dispatch: Dispatch<Actions>}

const useStoreFactory = <State extends object, Actions>(store: State, dispatch: Dispatch<Actions>) => {
  const [, setVersion] = useState(0)
  const [state, subscribe] = createSnapshot(store)
  useEffect(() => subscribe(() => setVersion((version) => version + 1)), [subscribe])

  // @TODO: state에 직접 입력하는 방식이 아니라 proxy에서 get를 하자!
  state.dispatch = dispatch
  return state as UseStore<State, Actions>
}

export function createStorePart<State extends object, Actions>(options = {}) {
  const state: State = {} as State

  const store = createStoreProxy<State>(state, state)

  const reducer = <T, R extends T>(init: Init<State, T>, fn: ReducerFn<State, Actions> = noop): R => new Reducer(init, fn) as R

  const dispatch = createDispatch<State, Actions>(store, options)

  const snapshot = () => createSnapshot<State>(store)

  const useStore = (name: string) => useStoreFactory<State, Actions>(store, dispatch)

  return {store, reducer, dispatch, snapshot, useStore}
}

//
//
// createStore
// ----------------------------------------------------------------------------------
type ReducerFactoryFn<State, Actions> = <T, R extends T>(init: Init<State, T>, fn?: ReducerFn<State, Actions>) => R

interface Builder<State, Actions> {
  store: State
  reducer: ReducerFactoryFn<State, Actions>
}

const logger = (api) => (next) => (action) => {
  const {type, payload} = action
  console.group(type + "(", ...payload, ")")
  // console.groupCollapsed("(callstack)")
  // console.trace("")
  // console.groupEnd()
  next(action)
  console.log(api.getState())
  console.groupEnd()
}

const tmpOption = {
  middleware: logger,
}

export function createStore<State extends object, Actions = null>(init: (builder: Builder<State, Actions>) => void, options = tmpOption) {
  const {store, reducer, useStore} = createStorePart<State, Actions>(options)

  init({store, reducer})
  return useStore
}
