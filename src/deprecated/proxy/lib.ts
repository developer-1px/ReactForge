import {useEffect, useMemo, useState} from "react"

type Readonly<T> = {
  readonly [K in keyof T]: Readonly<T[K]>
}

const PathSymbol = Symbol("path")
const DepSymbol = Symbol("dep")

const getValue = (root: unknown, path: string[]) => {
  return path.reduce((acc, prop) => acc && acc[prop], root)
}

const handleProxy = <T>(getValue, override: ProxyHandler<T>) => {
  return new Proxy(
    {},
    {
      get(target, p, receiver) {
        if (override[p]) return override[p]
        return (_, ...args) => Reflect[p](getValue(), ...args)
      },
    }
  )
}

const createPathProxy = (root: unknown) => {
  const dirtySet = Set<string>
  const deps = new Set()

  const getter = (path) => (_, prop, receiver) => {
    if (prop === PathSymbol) {
      return path.join(".")
    }
    if (prop === DepSymbol) {
      return deps
    }

    const get = () => getValue(root, path)
    if (prop === "valueOf") {
      return get
    }

    // const pathString = [...path, prop].join(".")
    // deps.add(pathString)
    //
    // const reducer = store[prop] //getValueFromPath(store, path)
    //
    // console.log(">>>>>>>>>>>>>>>>>>>>>", pathString, reducer)
    //
    // if (reducer instanceof Reducer && reducer.computed) {
    //   const tracked = new Set()
    //   const forkState = createStateProxy(store, root, dirtySet, path, tracked)
    //   const result = reducer.computed(forkState)
    //   console.log("tracked", tracked)
    //   return result
    // }

    const current = get()

    // if (current === undefined || current === null) {
    //   return current
    // }

    let next = Reflect.get(current, prop, receiver)

    // if (typeof next === "function") {
    //   return next()
    // }

    return next
  }

  const setter = (path) => (_, prop, value, reciver) => {
    // const get = () => getValueFromPath(root, path)
    //
    // const fullPath = [...path, prop]
    // fullPath.forEach((_, i, A) => {
    //   const pathString = A.slice(0, i + 1).join(".")
    //   dirtySet.add(pathString)
    // })
    //
    // const current = get()
    // current[prop] = value.valueOf()

    // notify(fullPath.join("."), value, root)
    // console.log("state." + fullPath.join("."), value)

    return true
  }

  const createPathProxySub = (target: unknown, path: string[] = []) => {
    const get = () => getValue(root, path)

    const state = new Proxy(
      target,
      handleProxy(get, {
        get(target, prop, reciver) {
          const result = getter(path)(target, prop, reciver)
          return result && typeof result === "object" ? createPathProxySub([...path, prop.toString()]) : result
        },

        set(...args) {
          return setter(path)(...args)
        },
      })
    )

    return state
  }

  return createPathProxySub(root)
}

const createStateProxy = <T>(store, root: T, dirtySet: Set<string>, path: string[] = [], deps = new Set()): T => {
  const get = () => getValue(root, path)

  const state = new Proxy(
    get(),
    handleProxy(get, {
      get(_, prop: string | symbol, receiver) {
        if (prop === PathSymbol) {
          return path.join(".")
        }
        if (prop === DepSymbol) {
          return deps
        }
        if (prop === "valueOf") {
          return get
        }

        const pathString = [...path, prop].join(".")
        deps.add(pathString)

        const reducer = store[prop] //getValueFromPath(store, path)

        console.log(">>>>>>>>>>>>>>>>>>>>>", pathString, reducer)

        if (reducer instanceof Reducer && reducer.computed) {
          const tracked = new Set()
          const forkState = createStateProxy(store, root, dirtySet, path, tracked)
          const result = reducer.computed(forkState)
          console.log("tracked", tracked)
          return result
        }

        const current = get()

        if (current === undefined || current === null) {
          return current
        }

        let next = Reflect.get(current, prop, receiver)

        if (typeof next === "function") {
          return next()
        }

        if (typeof next !== "object") {
          return next
        }

        return createStateProxy(store, root, dirtySet, [...path, prop.toString()], deps)
      },

      set(_, prop, value) {
        const fullPath = [...path, prop]
        fullPath.forEach((_, i, A) => {
          const pathString = A.slice(0, i + 1).join(".")
          dirtySet.add(pathString)
        })

        const current = get()
        current[prop] = value.valueOf()

        // notify(fullPath.join("."), value, root)
        // console.log("state." + fullPath.join("."), value)

        return true
      },
    })
  )

  return state
}

const createStoreProxy = (store, root) => {
  return new Proxy(store, {
    set(target, prop, value, receiver): boolean {
      //
      if (value instanceof Reducer) {
        root[prop] = value.initValue
      }

      store[prop] = value
      return true
    },
  })
}

type Init<T, State> = void | T | ((state: State) => Init<T, State>)
type On<Actions, State> = {
  [K in keyof Actions]: (fn: (state: State) => Actions[K]) => void
}

class Reducer<T, State> {
  constructor(
    public initValue: T | undefined,
    public computed: (state: State) => T | undefined,
    public func: Function
  ) {}
}

export const createStore = <Actions, State>() => {
  interface Mutation {
    path: string
    value: unknown
    state: State
  }

  let version = 0

  type MutationCallback = (mutation: Mutation) => void

  const mutationObservers = new Set<MutationCallback>()

  const subscribe = (fn: (mutation: Mutation) => void) => {
    mutationObservers.add(fn)
    return () => void mutationObservers.delete(fn)
  }

  const dirtySet = new Set()

  const notify = (dirtySet: Set<string>) => {
    version++
    mutationObservers.forEach((mutationCallback) => {
      // console.warn()

      const invalidedStates = Array.from(forkStates).filter((state) => {
        const deps = state[DepSymbol]
        for (const item of deps) {
          dirtySet.has(item)
          return true
        }
        return false
      })

      console.warn({invalidedStates})

      mutationCallback(new Set(invalidedStates))
    })
  }

  const originalStore = {}
  const root = {} as State

  const forkStates = new Set()

  const forkState = () => {
    const state = createStateProxy(originalStore, root, dirtySet) as State
    forkStates.add(state)
    return state
  }

  const state = forkState()

  const store = createStoreProxy(originalStore, root, state) as State

  let snapshot = state

  // ----

  const noop = () => {}

  const $dispatch = (type: string, args: unknown[]) => {
    const on = new Proxy(Function, {
      get: (_, handlerType: string) => (fn: Function) => {
        if (handlerType === type) {
          // @TODO: state에 뭔가를 추적을 할 수 있는 것들을 넣으면 좋겠는데...
          fn(state)(...args)
        }
      },
      apply(_, thisArg, argumentsList) {
        //TODO
      },
    }) as On<Actions, State>

    // @TODO: store키 직렬화 필요. ex) store.Query.todos = store["Query.todos"]
    for (const key in store) {
      // @TODO: key를 통해서 action과 state 변화 추적 로그도 만들어야 함!

      const reducer = store[key]
      if (reducer instanceof Reducer) {
        reducer.func(on)
      }
    }
  }

  const dispatch = new Proxy(Function, {
    get:
      (_, type: string) =>
      (...payload: unknown[]) => {
        //
        dirtySet.clear()

        console.group(type + "(", ...payload, ")")
        console.groupCollapsed("(callstack)")
        console.trace("")
        console.groupEnd()
        $dispatch(type, payload)
        console.groupEnd()

        snapshot = createStateProxy(originalStore, root, dirtySet)
        window.state = snapshot

        console.warn({dirtySet})

        notify(dirtySet)
      },
  }) as Actions

  const reducer = <T>(init: Init<T, State>, func: (on: On<Actions, State>) => void = noop): T => {
    let initValue = undefined
    let computed = undefined

    if (typeof init === "function") {
      computed = init
    } else {
      initValue = init
    }
    return new Reducer<T, State>(initValue, computed, func) as T
  }

  const useStore = () => {
    const newState = useMemo(() => forkState(), [])
    const [_state, setState] = useState(newState)
    useEffect(() => {
      return subscribe(() => {})
    }, [])
    return _state
  }

  return {
    store,
    dispatch,
    reducer,

    subscribe,
    useStore,
  }
}
