// eslint-disable-next-line @typescript-eslint/ban-types
type PrimitiveType = undefined|null|boolean|string|number|Function;

// eslint-disable-next-line @typescript-eslint/ban-types
type DeepReadonly<T> = T extends Function|PrimitiveType ? T : T extends Array<infer U> ? ReadonlyArray<DeepReadonly<U>> : { readonly [P in keyof T]:DeepReadonly<T[P]> };

export interface Collection<T> {
  [id:string|number]:T
}


const listeners:Record<string, Function[]> = {}

const emit = (type:string, payload:Array<unknown>) => {

  console.warn("emit!", {type, payload}, listeners)

  for (const handler of (listeners[type] ?? [])) {
    handler(...payload)
  }
}

const createPathProxy = <T>(path:string):T => {
  let value:unknown = null
  return new Proxy(Function, {
    get(_, prop) {
      if (prop === "toString") return () => path
      return createPathProxy(path + "." + prop.toString())
    },
    apply(_, __, argumentsList) {
      if (argumentsList.length === 0) return value
      value = argumentsList[0]
    }
  }) as T
}


type Selector<State, T> = (store:State) => T

type On<Actions> = { [K in keyof Actions]:(fn:Actions[K]) => void }

type ArrayItemOf<T> = T extends (infer U)[] ? U : T;

type Helper<T, Actions> = {
  on:On<Actions>
  set:(value:T) => T
  value:T,
  draft:T,

  insert:(value:ArrayItemOf<T>) => ArrayItemOf<T>
  toggle:(find:ArrayItemOf<T>) => ArrayItemOf<T>
  remove:(find:ArrayItemOf<T>) => ArrayItemOf<T>
}

const proxy = {
  dispatch() {},
  on() {}
}

export const createStateForge = <Actions, State>(path:string) => {

  const ID = {}

  const store:State = createPathProxy(path)

  const dispatch:Actions = new Proxy(proxy.dispatch, {
    get(_, type:string) {
      return (...payload:unknown[]) => {
        emit(type, payload)
      }
    }
  })

  const createSlice = <T, V extends T>(path:(store:State) => T, initValue:V, fn:(t:Helper<T, Actions&State>) => void):T => {

    const pathObject = path(store)

    console.warn("pathObject", pathObject)
    console.warn("pathString", pathObject.toString())

    const actionHandlers = []

    const on:On<Actions&State> = new Proxy(proxy.on, {
      get(target, type:string) {
        return (fn) => {
          actionHandlers.push([type, fn])
        }
      },
      apply(target, thisArg, argumentsList) {
        //TODO
      },
    })

    const helper = {
      on
    } as Helper<T>


    pathObject({
      ID,
      initValue,
      sliceFn: () => fn(helper),
      actionHandlers,
      invoked: false
    })

    return pathObject
  }

  const createSelector = <T>(selector:Selector<State, T>, fn:Function, fn2:Function):T => {}

  const createQuery = <T>():T => {}

  const createEffect = () => {}


  // -- configureStore
  const configureStore = (slices:State, options = {}) => {
    console.warn("configureStore")

    const state = Object.fromEntries(Object.entries(slices).map(([key, value]) => {

      if (typeof value === "function") {
        const res = value()
        if (res.ID === ID) {
          console.warn(">>>>>>>>>>>>>>>>>>>> res.invokedres.invoked", res.invoked, value.toString())
          if (!res.invoked) {
            res.invoked = true
            res.sliceFn()
            value = res.initValue
          }
        }
      }

      // @TODO: 2단, 3단에 대한 처리가 필요하다!

      return [key, value]
    }))


    window.state = state

    const select = <T>(selector:Selector<State, T>):T => createPathProxy(selector(store).toString())

    return {
      state,
      select,
      dispatch
    }
  }

  return {
    createSlice,
    createSelector,
    createQuery,
    createEffect,
    configureStore,
  }
}