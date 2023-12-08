import {createContext, createElement, Key, ReactNode, useContext, useEffect, useState} from "react"

export const isObject = (target: unknown): target is object => Object(target) === target

//
//
// Store
// --------------------------------------------------------------------
const NON_PROXY_TYPES = [Function, Date, RegExp, Set, Map, WeakSet, WeakMap, Error, ArrayBuffer, globalThis.Node || Function]
const isProxiable = (target: unknown) => isObject(target) && !NON_PROXY_TYPES.some((type) => target instanceof type)
const proxiedObjects = new Map<object, object>()

const createCachedProxy = <T extends object>(obj: T, handler: ProxyHandler<T>) => {
  if (!isProxiable(obj)) return obj
  if (proxiedObjects.has(obj)) return proxiedObjects.get(obj) as T
  const proxy = new Proxy(obj, handler)
  proxiedObjects.set(obj, proxy)
  return proxy
}

const VERSION = Symbol("@version")

const registerVersionedPrototype = (target: object) => {
  let proto = Object.getPrototypeOf(target)
  if (proto && VERSION in proto) {
    return proto
  }

  proto = {[VERSION]: {}}
  Object.setPrototypeOf(target, proto)
  return proto
}

// createStoreProxy(): 상태 관리를 위한 Proxy를 생성합니다. 상태 객체의 속성 접근과 변경을 감시하며, Reducer를 통해 계산된 값을 관리합니다.

// @FIXME: computed value를 Object geterr와 Proxy get trap에서 둘다 쓰고 있다. 하나는 필요없다.
// @FIXME: 항상 계산하는 게 아니라 관련 데이터가 업데이트 되었을때에만 갱신하는 방식을 구현하자!

// @FIXME: get에서 Proxy를 만들지 말고 set에서 만들자!

function createStoreProxy<State extends object>(obj: State | object, root: State): State {
  return createCachedProxy(obj, {
    get(target, prop, receiver) {
      // Reducer: Computed Value 처리
      // const reducer = Object.getPrototypeOf(target)[prop]
      // if (reducer instanceof Reducer && reducer.computed) {
      //   const state = createStoreProxy(root, root)
      //   const result = reducer.computed(state)
      //   return createStoreProxy(result, root)
      // }

      const result = Reflect.get(target, prop, receiver)
      return createStoreProxy(result, root)
    },

    // store.id = key
    // store.val = value
    // store.count = reducer(0, {...})
    set(target, prop, value, receiver) {
      const currentValue = Reflect.get(target, prop, receiver)
      if (Object.is(currentValue, value)) {
        return true
      }

      // update mark: version up!
      const proto = registerVersionedPrototype(target)
      proto[VERSION][prop] = (proto[VERSION][prop] || 0) + 1

      // set reducer
      if (value instanceof Reducer) {
        // register Reducer
        const reducer = value
        proto[prop] = reducer

        // Computed Getter
        if (reducer.computed) {
          const [state, _, marker, reconcile] = createSnapshot(root)
          let isDirty = true
          let computedValue: unknown

          Object.defineProperty(proto, prop, {
            get: () => {
              reconcile(() => (isDirty = true))
              computedValue = isDirty ? reducer.computed(state) : computedValue
              console.log("called getter: isDirty", prop, isDirty, marker)
              if (isDirty) {
                proto[VERSION][prop] = (proto[VERSION][prop] || 0) + 1
                isDirty = marker.size === 0
              }
              return computedValue
            },
            configurable: true,
          })
          return true
        }

        // init Reducer value
        if (currentValue === undefined) {
          return Reflect.set(target, prop, reducer.value, receiver)
        }

        return true
      }

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
      const result = Reflect.get(target, prop, receiver)

      if (Reflect.getOwnPropertyDescriptor(target, prop)) {
        return result
      }

      if (isProxiable(result)) {
        Reflect.set(target, prop, Object.create(result), receiver)
        return createDraftProxyPath(result)
      }

      return result
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

const compareSnapshotKey = (obj1: Record<string, unknown>, obj2: Record<string, unknown>) => {
  const keys1 = Object.keys(obj1)
  for (const key of keys1) if (obj1[key] !== obj2[key]) return false
  return true
}

const createSnapshotPath = (obj: object, marked): object => {
  if (!isProxiable(obj)) return obj
  return new Proxy(obj, {
    get(target, prop, receiver) {
      const proto = Object.getPrototypeOf(target)
      const versionMap = proto[VERSION]
      if (versionMap && typeof prop === "string") {
        const lastVersions = marked.get(versionMap) || {}
        lastVersions[prop] = versionMap[prop]
        marked.set(versionMap, lastVersions)
      }

      const result = Reflect.get(target, prop, receiver)
      return createSnapshotPath(result, marked)
    },
  }) as object
}

function createSnapshot<State extends object>(store: State) {
  const marker = new Map<Record<string, number>, Record<string, number>>()
  const snapshot = createSnapshotPath(store, marker) as State

  const updateCallbacks = new Set()

  const reconcile = (ifDirty: Function) => {
    for (const [key, snapshotKeys] of marker) {
      if (!compareSnapshotKey(snapshotKeys, key)) {
        console.log("dirty!", key, snapshotKeys)
        ifDirty(snapshotKeys)
        Object.keys(snapshotKeys).forEach((prop) => (snapshotKeys[prop] = key[prop]))
        return true
      }
    }

    return false
  }

  const mutationHandler = (...args) => {
    reconcile((snapshotKeys) => updateCallbacks.forEach((cb) => cb(snapshotKeys)))
  }

  const subscribe = (callback: Function) => {
    updateCallbacks.add(callback)
    const unsubscribe = subscribeMutation(mutationHandler)
    return () => {
      updateCallbacks.delete(callback)
      if (updateCallbacks.size === 0) unsubscribe()
    }
  }

  return [snapshot, subscribe, marker, reconcile] as const
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

const publishMutation = (...args) => {
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
    publishMutation(store, stateChanges)
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
  const [state, subscribe] = createSnapshot(store, dispatch)
  useEffect(() => subscribe(() => setVersion((version) => version + 1)), [subscribe])
  return state as UseStore<State, Actions>
}

//
//
// createStorePart
// -----------------------------------------------------------------------------------------------

const logger = (api) => (next) => (action) => {
  if (!globalThis.document) {
    next(action)
    return
  }

  const {type, payload} = action
  console.group(type + "(", ...payload, ")")
  console.groupCollapsed("(callstack)")
  console.trace("")
  console.groupEnd()
  next(action)
  console.log(api.getState())
  console.groupEnd()
}

const tmpOption = {
  middleware: logger,
}

export function createStorePart<State extends object, Actions>(options = {}) {
  options = {...tmpOption, ...options}

  const state: State = (options.initValue ?? {}) as State

  const store = createStoreProxy<State>(state, state)
  const proto = registerVersionedPrototype(store)

  const reducer = <T, R extends T>(init: Init<State, T>, fn: ReducerFn<State, Actions> = noop): R => new Reducer(init, fn) as R

  const dispatch = createDispatch<State, Actions>(store, options)
  proto.dispatch = dispatch

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

export function createStore<State extends object, Actions = null>(init: (builder: Builder<State, Actions>) => void, options = tmpOption) {
  const {store, reducer, useStore} = createStorePart<State, Actions>(options)

  init({store, reducer})
  return useStore
}

//
//
// createComponentStore
// ------------------------------------------------------------------------------------------
export function createComponentStore<State extends object, Actions>(
  init: (builder: Builder<State, Actions>) => void,
  repogitory: Record<PropertyKey, State> = {}
) {
  const ComponentStoreContext = createContext<string | number>("")

  const memo = Object.create(null) as Record<string, () => UseStore<State, Actions>>

  const useComponentStore = (...args) => {
    const id = useContext(ComponentStoreContext)

    // @FIXME!!
    repogitory[id] = repogitory[id] || {}
    const options = {
      initValue: repogitory[id],
    }

    const useStore = memo[id] ?? (memo[id] = createStore<State, Actions>(init, options))
    return useStore(...args)
  }

  const ComponentStoreProvider = (props: {id: string | number; key: Key; children: ReactNode}) =>
    createElement(ComponentStoreContext.Provider, {value: props.id}, props.children)

  return [useComponentStore, ComponentStoreProvider] as const
}
