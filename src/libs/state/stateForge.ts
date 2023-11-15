// eslint-disable-next-line @typescript-eslint/ban-types
import {getProperty, setProperty} from "dot-prop"
import {useEffect, useState} from "react"

type PrimitiveType = undefined | null | boolean | number | string

// eslint-disable-next-line @typescript-eslint/ban-types
type DeepReadonly<T> = T extends Function | PrimitiveType ? T : T extends Array<infer U> ? ReadonlyArray<DeepReadonly<U>> : { readonly [P in keyof T]:DeepReadonly<T[P]> };

export interface Collection<T> {
  [id:string | number]:T
}

const createSelectorPathProxy = <T>(path:string):T => {
  let value:unknown = null
  return new Proxy(Function, {
    get(_, prop:string) {
      if (prop === "toString") return () => path
      return createSelectorPathProxy(path + (/^\d/.test(prop) ? `[${prop}]` : `.${prop}`))
    },
    apply(_, __, argumentsList) {
      if (argumentsList.length === 0) return value
      value = argumentsList[0]
    }
  }) as T
}

type ArrayItemOf<T> = T extends (infer U)[] ? U : T;

const IS_SLICE = Object.create(null)
const IS_SELECTOR = Object.create(null)

const proxy = {
  dispatch() {},
  on() {}
}

const __state__ = Object.create(null)
// @FIXME: debug용
globalThis.state = __state__

export const createStateForge = <State, Actions>(rootPath:string) => {

  const store:State = createSelectorPathProxy(rootPath)

  interface Mutation {
    path:string
    value:unknown
    state:State
  }

  type MutationCallback = (mutation:Mutation) => void

  const mutationObservers = new Set<MutationCallback>()

  const SET = <T>(object:Record<string, unknown>, path:string, value:T):T => {
    console.warn("SET", path, value)

    setProperty(object, path, value)
    mutationObservers.forEach(fn => {
      const mutation = {path, value, state: GET<State>(__state__, path)}
      fn(mutation)
    })
    return value
  }

  const GET = <T>(object:Record<string, unknown>, path:string, defaultValue?:T):T => {

    const v = getProperty(object, path, defaultValue)
    console.warn("GET", path, v)
    return v
  }


  type Selector<T> = (store:State) => T

  type On<Actions> = { [K in keyof Actions]:(fn:Actions[K]) => void }

  interface Helper<T> {
    on:On<Actions>

    initValue:T,
    draft:T,

    set(value:T):T

    set(setter:((prev:T) => T)):T

    insert:(value:ArrayItemOf<T>) => ArrayItemOf<T>
    toggle:(find:ArrayItemOf<T>) => ArrayItemOf<T>
    remove:(find:ArrayItemOf<T>) => ArrayItemOf<T>
  }

  const createSlice = <T, V extends T>(selector:Selector<T>, initValue:V, fn:(t:Helper<T>) => void):T => {

    const slice = selector(store)
    const path = slice.toString()

    console.warn("[createSlice]", path, initValue)

    // actionHandlers
    const actionHandlers = []

    const on:On<Actions> = new Proxy(proxy.on, {
      get: (target, type:string) => (fn) => {
        actionHandlers.push([type, fn])
      },
      apply(target, thisArg, argumentsList) {
        //TODO
      },
    })

    const createStateHelper = <T>():Helper<T> => {

      const set = <T>(value:T):T => {
        if (typeof value === "function") {
          console.warn("prev", GET(__state__, path))
          console.warn("fn", value)

          const result = value(GET(__state__, path))

          console.log({result})

          return SET(__state__, path, value(GET(__state__, path)))
        }
        SET(__state__, path, value)
        return value
      }

      const insert = <T>(value:T):T => value

      const draft = createSelectorPathProxy<T>("")

      return {
        initValue,

        on,
        draft,
        set,

        insert,
      }
    }

    slice({
      type: IS_SLICE,
      path: slice.toString(),
      value: initValue,
      actionHandlers: null,
      setup() {
        fn(createStateHelper())
        this.actionHandlers = [...actionHandlers]
      },
    })

    return slice
  }

  const createSelector = <T>(selector:((state:State) => T)):T => {
    return selector(store)
  }

  const createQuery = <T>():T => {
  }

  const createEffect = () => {
  }


  const defaultMiddleware = (store) => (next) => (type:string, args:unknown[]) => next(type, args)

  const createStore = (slices:State, middleware = defaultMiddleware) => {

    const $dispatch = (type:string, args:unknown[]) => {
      for (const handler of actionHandlers[type] ?? []) {
        handler(...args)
      }
    }

    const $middleware = middleware(store)($dispatch)

    const actionHandlers:Record<string, Function[]> = Object.create(null)

    const dispatch = new Proxy(proxy.dispatch, {
      get: (_, type:string) => (...payload:unknown[]) => {
        console.warn({payload})
        $middleware(type, payload)
      }
    }) as Actions

    // @TODO: 여기 코드 꼭 정리하자!!
    const composeSlice = (slices) => {
      if (!slices || typeof slices !== "object") {
        return slices
      }

      return Object.fromEntries(Object.entries(slices).map(([key, value]) => {

        // @FIXME: 일단 구현하고 정리하자!
        if (typeof value === "function") {
          const slice = value()

          // @FIXME
          if (!slice) {
            return [key, value]
          }

          //
          if (slice.type === IS_SLICE) {
            if (!slice.actionHandlers) {
              slice.setup()
              console.warn(`[${slice.path}]:setup()`, slice.actionHandlers)
            }

            // register handlers
            for (const [type, handler] of slice.actionHandlers) {
              actionHandlers[type] = actionHandlers[type] ?? []
              actionHandlers[type].push(handler)
            }

            value = slice.value
          }

          if (slice.type === IS_SELECTOR) {
            console.warn("selector!!!")
          }
        }
        else {
          value = composeSlice(value)
        }

        return [key, value]
      }))
    }

    // @FIXME: 일단 구현하고 정리하자!
    const initState = composeSlice(slices)
    SET(__state__, rootPath, initState)

    const select = <T>(selector:Selector<T>):T => {
      const path = selector(store).toString()
      return GET<T>(__state__, path)
    }

    const subscribe = (fn:(mutation:Mutation) => void) => {
      mutationObservers.add(fn)
      return () => void mutationObservers.delete(fn)
    }

    // for React
    const useSelect = <T>(selector:Selector<T>):T => {
      const path = selector(store).toString()
      const initValue = GET<T>(__state__, path)

      const [value, setValue] = useState<T>(initValue)
      useEffect(() => {
        return subscribe(mutation => {
          console.warn({mutation})
          if (mutation.path === path) {
            setValue(mutation.value as T)
          }
        })
      })

      return value
    }

    return {
      select,
      dispatch,
      subscribe,

      // for React
      useSelect,
    }
  }

  return {
    createSlice,
    createSelector,
    createEffect,
    createQuery,
    createStore,
  }
}