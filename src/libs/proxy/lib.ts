import {useEffect, useState} from "react"

type Readonly<T> = {
  readonly [K in keyof T]: Readonly<T[K]>
}

const PathSymbol = Symbol("path")
const DepSymbol = Symbol("dep")

const getValue = (root: unknown, path: string[]) => {
  const obj = path.reduce((acc, prop) => acc && acc[prop], root)
  return obj ? obj.valueOf() : obj
}

const handleProxy = <T>(getValue, override: ProxyHandler<T>) =>
  new Proxy(
    {},
    {
      get(target, p, receiver) {
        if (override[p]) return override[p]
        return (_, ...args) => Reflect[p](getValue(), ...args)
      },
    }
  )

const createStoreProxy = <T>(root: T, notify: Function, path: string[] = [], deps = new Set()): T => {
  const get = () => getValue(root, path)

  return new Proxy(
    get(),
    handleProxy(get, {
      get(_, prop: string | symbol, receiver) {
        if (prop === PathSymbol) {
          return path.join(".")
        }
        if (prop === DepSymbol) {
          return deps
        }
        if (prop === "valueOf" || prop === "toString") {
          return get
        }

        const pathString = [...path, prop].join(".")
        deps.add(pathString)

        const current = get()

        if (current === undefined || current === null) {
          return current
        }

        const next = Reflect.get(current, prop, receiver)
        if (typeof next === "function") {
          return next()
        }

        if (typeof next !== "object") {
          return next
        }

        return createStoreProxy(root, notify, [...path, prop.toString()], deps)
      },

      set(_, prop, value) {
        const fullPath = [...path, prop]
        fullPath.forEach((_, i, A) => {
          const pathString = A.slice(0, i).join(".")
          if (!pathString) return
          console.log("set pathString", pathString)
          if (deps.has(pathString)) {
            console.log("notify!!!!!!!", pathString)
            notify(pathString, value, root)
          }
        })

        const current = get()
        current[prop] = value.valueOf()

        notify(fullPath.join("."), value, root)
        console.log("state." + fullPath.join("."), value)

        return true
      },
    })
  )
}

export const createStore = <Actions, State>() => {
  type ReadOnlyState = Readonly<State>

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

  const notify = <T>(path: string, value: T) => {
    version++
    mutationObservers.forEach(mutationCallback => {
      const mutation = {path, value, state: store}
      mutationCallback(mutation)
    })
  }

  const root = {}

  const store = createStoreProxy(root, notify) as State

  // ----
  type Init<T> = void | T | ((state: State) => Init<T>)
  type On = {[K in keyof Actions]: (fn: (state: State) => Actions[K]) => void}

  const noop = () => {}

  // actionHandlers
  const actionHandlers: Record<string, Function[]> = Object.create(null)

  const on = new Proxy(Function, {
    get: (target, type: string) => fn => {
      actionHandlers[type] = actionHandlers[type] || []
      actionHandlers[type].push(fn)
    },
    apply(target, thisArg, argumentsList) {
      //TODO
    },
  }) as On

  const $dispatch = (type: string, args: unknown[]) => {
    for (const handler of actionHandlers[type] ?? []) {
      handler(store)(...args)
    }
  }

  // const $middleware = middleware(store)($dispatch)

  const dispatch = new Proxy(Function, {
    get:
      (_, type: string) =>
      (...payload: unknown[]) => {
        console.group(type + "(", ...payload, ")")
        console.groupCollapsed("(callstack)")
        console.trace("")
        console.groupEnd()
        $dispatch(type, payload)
        window.state = store.valueOf()
        console.groupEnd()
      },
  }) as Actions

  const reducer = <T>(init: Init<T>, fn: (on: On) => void = noop): T => {
    if (typeof init !== "function") {
      fn(on)
      return init
    }

    return init
  }

  const useStore = (): ReadOnlyState => {
    const [state, setState] = useState(store)
    useEffect(() => subscribe(() => setState({...store})), [])
    return state as ReadOnlyState
  }

  return {
    store,
    dispatch,
    reducer,

    subscribe,
    useStore,
  }
}
