import {createContext, createElement, Key, ReactNode, useContext, useEffect, useState} from "react"

const NON_PROXY_TYPES = [Function, Date, RegExp, Set, Map, WeakSet, WeakMap, Error, ArrayBuffer, globalThis.Node || Function]

const isObject = (target: unknown): target is object => Object(target) === target

const isProxiable = (target: unknown) => isObject(target) && !NON_PROXY_TYPES.some((type) => target instanceof type)

const valueOf = <T>(target: T): T => (target && typeof target.valueOf === "function" ? (target.valueOf() as T) : target)

const mapCacheValueOf = <T>(key: unknown, map: Map<unknown, T>, data: T): T =>
  map.has(key) ? (map.get(key) as T) : void map.set(key, data) || data

const trackedObjects = new Set<object>()

//
//
// Store
// --------------------------------------------------------------------
type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

const STORE = Symbol("@@store")
const registerStorePrototype = (target: object) => {
  let proto = Object.getPrototypeOf(target)
  if (proto && STORE in proto) {
    return proto
  }

  proto = {[STORE]: true}
  Object.setPrototypeOf(target, proto)
  return proto
}

// createStoreProxy(): 상태 관리를 위한 Proxy를 생성합니다. 상태 객체의 속성 접근과 변경을 감시하며, Reducer를 통해 계산된 값을 관리합니다.

// @FIXME: computed value를 Object geterr와 Proxy get trap에서 둘다 쓰고 있다. 하나는 필요없다.
// @FIXME: 항상 계산하는 게 아니라 관련 데이터가 업데이트 되었을때에만 갱신하는 방식을 구현하자!

// @FIXME: get에서 Proxy를 만들지 말고 set에서 만들자!
const storeProxyMap = new Map<object, object>()

function createStoreProxy<State extends object>(obj: State | object, root: State): State {
  if (!isProxiable(obj)) return obj as State
  return mapCacheValueOf(
    obj,
    storeProxyMap,
    new Proxy(obj, {
      get(target, prop, receiver) {
        if (prop === "valueOf") {
          return () => target
        }

        const result = Reflect.get(target, prop, receiver)
        if (!trackedObjects.has(result)) {
          return result
        }

        return createStoreProxy(valueOf(result), root)
      },

      // store.id = key
      // store.val = value
      // store.count = reducer(0, {...})
      set(target, prop, value, receiver) {
        const currentValue = Reflect.get(target, prop, receiver)
        if (Object.is(currentValue, value)) {
          return true
        }

        // set reducer
        if (value instanceof Reducer) {
          // register Reducer
          const reducer = value
          const proto = registerStorePrototype(target)
          proto[prop] = reducer

          // Computed Getter
          if (reducer.computed) {
            const [state, _, marker, reconcile] = createSnapshot(root)
            let isDirty = true
            let computedValue: unknown

            Object.defineProperty(proto, prop, {
              get: () => {
                // reconcile(() => (isDirty = true))
                computedValue = isDirty ? reducer.computed(state) : computedValue
                if (isDirty) {
                  isDirty = marker.size === 0
                }
                isDirty = true
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

        // update mark: version up!
        return Reflect.set(target, prop, value, receiver)
      },
    })
  ) as State
}

//
//
// Snapshot
// ----------------------------------------------------------------

const compareSnapshotKey = (obj1: Record<PropertyKey, unknown>, obj2: Record<PropertyKey, unknown>) => {
  const keys1 = Object.keys(obj1)
  for (const key of keys1) if (obj1[key] !== obj2[key]) return false
  return true
}

const createSnapshotPath = (obj: object, marked: Map<unknown, Record<PropertyKey, unknown>>, snapshotMap): object => {
  if (!isProxiable(obj)) return obj
  return mapCacheValueOf(
    obj,
    snapshotMap,
    new Proxy(obj, {
      get(target, prop, receiver) {
        if (prop === "valueOf") {
          return () => target
        }

        const mark = mapCacheValueOf(target, marked, {})
        mark[prop] = target[prop]
        trackedObjects.add(target)

        const result = Reflect.get(target, prop, receiver)
        return createSnapshotPath(result, marked, snapshotMap)
      },
    }) as object
  )
}

function createSnapshot<State extends object>(store: State) {
  const marker = new Map<unknown, Record<string, object>>()
  const snapshotMap = new Map<unknown, State>()
  const snapshot = createSnapshotPath(store, marker, snapshotMap) as State

  const updateCallbacks = new Set()

  const reconcile = (ifDirty: Function) => {
    for (const [target, lastVersions] of marker) {
      if (!compareSnapshotKey(lastVersions, target)) {
        // console.log("dirty!", lastVersions, target)
        ifDirty(lastVersions)
        return true
      }
    }

    return false
  }

  const mutationHandler = (...args) => {
    reconcile((snapshotKeys) => {
      updateCallbacks.forEach((cb) => cb(snapshotKeys))
      marker.clear()
    })
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
// Draft
// -----------------------------------------------------------------------
const createDraftProxyPath = (obj: object, draftMap: Map<unknown, object>): object => {
  if (!isProxiable(obj)) return obj
  return mapCacheValueOf(
    obj,
    draftMap,
    new Proxy(obj, {
      get(target, prop, receiver) {
        if (prop === "valueOf") {
          return () => target
        }

        const result = Reflect.get(target, prop, receiver)
        if (Reflect.getOwnPropertyDescriptor(target, prop)) {
          return result
        }

        if (isProxiable(result)) {
          Reflect.set(target, prop, Object.create(valueOf(result)), receiver)
          return createDraftProxyPath(result, draftMap)
        }

        return result
      },

      deleteProperty(target, prop) {
        return Reflect.set(target, prop, undefined)
      },
    }) as object
  )
}

export function createDraftProxy<State extends object>(store: State): State {
  const draftMap = new Map<unknown, object>()
  return createDraftProxyPath(Object.create(store), draftMap) as State
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
type ConditionFn<State> = (state: State) => boolean
type Can<Actions, State> = {
  [K in keyof Actions]: (fn: (...args: Actions[K] extends (...args: infer P) => unknown ? P : never[]) => ConditionFn<State>) => void
}
type ReducerFn<State, Actions> = (on: On<Actions, State>) => void

const noop = () => {}

class Reducer<State extends object, Actions, T> {
  public value: T | undefined
  public computed: (state: State) => T
  public guardFn: ReducerFn<State, Actions> = () => true

  constructor(
    public init: Init<State, T>,
    public reducerFn: ReducerFn<State, Actions>,
    public state: State
  ) {
    this.value = typeof init !== "function" ? init : undefined
    this.computed = typeof init === "function" ? init : undefined
  }
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

  // @FIXME: 1depth만 하자!! 깊이 다 들어가면 너무 많은 reducer를 찾아야 한다!!
  // @FIXME: 아니라면 store에 사용하는 reducer만 보관하는 로직을 작성해야한다.
  Object.entries(Object.getPrototypeOf(obj)).forEach(([key, value]) => {
    const currentPath = [...path, key]
    const res = callback(value, path, key)
    // if (res !== false && isObject(value)) {
    //   traverseReducer(value, callback, currentPath)
    // }
  })
}

const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>, flagDeleteUndefined = false) => {
  Object.keys(source).forEach((key) => {
    if (isObject(source[key])) {
      target[key] = target[key] || {}
      deepMerge(target[key], source[key])
    } else {
      if (flagDeleteUndefined && source[key] === undefined) {
        delete target[key]
      } else {
        target[key] = source[key]
      }
    }
  })
  return target
}

const createCan = <State, Actions>(type: string, payload: unknown[], draft: State) => {
  const guard = {isPass: true}
  return [
    guard,
    new Proxy(Function, {
      get: (_, actionType: string) => (fn: (...args: unknown[]) => ConditionFn<State, Actions>) => {
        if (actionType === type) {
          if (guard.isPass && !fn(...payload)(draft)) {
            guard.isPass = false
          }
        }
      },
    }) as Can<Actions, State>,
  ] as const
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

function createDispatch<State extends object, Actions>(store: State, state: State, options) {
  const defaultOptions = {}
  options = {...defaultOptions, ...options}
  const middleware = options.middleware

  const dispatchAction = (type: string, payload: unknown[]) => {
    const stateChanges = {}

    // reduce 실행
    traverseReducer(store, (reducer, path, prop) => {
      if (reducer instanceof Reducer && reducer.state === state) {
        const draft = createDraftProxy(state)
        const on = createOn<State, Actions>(type, payload, draft, dispatch)
        reducer.reducerFn(on)
        deepMerge(stateChanges, draft)
        return false
      }
    })

    deepMerge(store, stateChanges, true)
    publishMutation(state, stateChanges)
    trackedObjects.clear()
  }

  const next = ({type, payload}) => dispatchAction(type, payload)

  const dispatch = new Proxy(Function, {
    get(_, type: string) {
      return (...payload: unknown[]) => {
        const action = {type, payload}
        middleware({dispatch, state, options, getState: () => state})(next)(action)
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

const useStoreFactory = <State extends object, Actions>(_state: State) => {
  const [, setVersion] = useState(0)
  const [state, subscribe] = createSnapshot(_state)
  useEffect(() => subscribe(() => setVersion((version) => version + 1)), [subscribe])
  return state as UseStore<State, Actions>
}

//
//
// createStorePart
// -----------------------------------------------------------------------------------------------

let logger_index = 1
const logger = (api) => (next) => (action) => {
  if (!globalThis.document) {
    next(action)
    return
  }

  const debugLabel = api.options?.debugLabel ?? ""

  const {type, payload} = action
  console.group("#" + logger_index++, debugLabel, type + "(", ...payload, ")")
  console.groupCollapsed("(callstack)")
  console.trace("")
  console.groupEnd()

  try {
    next(action)
  } catch (e) {
    const state = api.getState()
    console.log(state)
    throw e
  }
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

  const snapshot = () => createSnapshot<State>(state)

  const dispatch = createDispatch<State, Actions>(store, state, options)
  const proto = registerStorePrototype(store)
  proto.dispatch = dispatch

  const reducer = <T, R extends T>(init: Init<State, T>, fn: ReducerFn<State, Actions> = noop): R => new Reducer(init, fn, state) as R

  reducer.withGuard = (fn) => {
    return (init, fn) => {
      const r = reducer(init, fn)
      r.guardFn = fn
      return r
    }
  }

  //
  // React
  const useStore = (debugLabel: string = "") => useStoreFactory<State, Actions>(state)

  return {store, snapshot, reducer, dispatch, useStore}
}

//
//
// createStore
// ----------------------------------------------------------------------------------
interface ReducerFactoryFn<State, Actions> {
  <T, R extends T>(init: Init<State, T>, fn?: ReducerFn<State, Actions>): R
  withGuard(fn: (can: Can<Actions, State>) => void): ReducerFactoryFn<State, Actions>
}

interface Builder<State, Actions> {
  store: Mutable<State>
  reducer: ReducerFactoryFn<State, Actions>
  dispatch: Dispatch<Actions>
}

export function createStore<State extends object = object, Actions extends object = object>(
  init: (builder: Builder<State, Actions>) => void = noop,
  options = tmpOption
) {
  const {store, reducer, dispatch, useStore} = createStorePart<State, Actions>(options)
  init({store, reducer, dispatch})
  return useStore
}

//
//
// createComponentStore
// ------------------------------------------------------------------------------------------
export function createComponentStore<State extends object, Actions>(init: (builder: Builder<State, Actions>) => void, label: string = "") {
  const ComponentStoreContext = createContext<string | number>("")

  const memo = Object.create(null) as Record<PropertyKey, () => UseStore<State, Actions>>

  const repository: Record<PropertyKey, State & {dispatch: Dispatch<Actions>}> = {}

  // @FIXME: 리파지토리 개념 다시 만들자!
  repository.of = (id: string) => {
    if (memo[id]) return repository[id]

    repository[id] = repository[id] || {}
    const options = {
      initValue: repository[id],
      debugLabel: label + "." + id,
    }

    if (!memo[id]) memo[id] = createStore<State, Actions>(init, options)
    return repository[id]
  }

  const useComponentStore = (id: PropertyKey | undefined = undefined, ...args) => {
    const contextId = useContext(ComponentStoreContext)
    id = id ?? contextId

    // @FIXME!!
    // console.log("id!!!", id)
    repository.create(id)
    const useStore = memo[id]
    return useStore(id, ...args)
  }

  const ComponentStoreProvider = (props: {id: string | number; key: Key; children: ReactNode}) =>
    createElement(ComponentStoreContext.Provider, {value: props.id}, props.children)

  return [useComponentStore, ComponentStoreProvider, repository] as const
}
