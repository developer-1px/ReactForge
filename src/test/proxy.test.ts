import {afterEach, beforeEach, describe, expect, it, vi} from "vitest"

const PathSymbol = Symbol("path")
const DepSymbol = Symbol("dep")

const proxy = (obj = Object.create(null)) => {
  return createSelectorPathProxy(obj)
}

const getValue = (root: unknown, path: string[]) => {
  const obj = path.reduce((acc, prop) => acc && acc[prop], root)
  return obj ? obj.valueOf() : obj
}

const handleProxy = <T>(getValue, override: ProxyHandler<T>) =>
  new Proxy(Object.create(null), {
    get(target, p, receiver) {
      if (override[p]) return override[p]
      return (_, ...args) => Reflect[p](getValue(), ...args)
    },
  })

const createSelectorPathProxy = <T>(root: T, path: string[] = [], deps = new Set()): T => {
  const get = () => getValue(root, path)

  return new Proxy(
    get(),
    handleProxy(get, {
      get(_, prop: string | symbol, receiver) {
        console.log("get!", prop)

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

        return createSelectorPathProxy(root, [...path, prop.toString()], deps)
      },

      set(_, prop, value) {
        const fullPath = [...path, prop]
        fullPath.forEach((_, i, A) => {
          const pathString = A.slice(0, i).join(".")
          if (!pathString) return
          console.log("set pathString", pathString)
          if (deps.has(pathString)) {
            console.log("notify!!!!!!!", pathString)
          }
        })

        const current = get()
        current[prop] = value.valueOf()
        return value
      },
    })
  )
}

const reducer = <T>(fn: () => T, deps: unknown[] = []): T => {
  return new Proxy(fn, {}) as T
}

const subscribe = (proxy, handler) => {}

describe("proxy", () => {
  it("xxxx", () => {
    const root = {a: 100, b: 200, foo: {bar: 300}}
    const obj = proxy(root)

    obj.Todo = {}

    const createTodo = (id: number, title: string) => ({id, title, completed: false})

    obj.Todo[1] = createTodo(1, "A")
    obj.Todo[2] = createTodo(2, "B")
    obj.Todo[3] = createTodo(3, "C")

    obj.todos = reducer(() => Object.values(obj.Todo))

    console.log(">>>>>>>> root.a", root.a)

    root.a = 500
    console.log(">>>>>>>> obj.a", obj.a)

    // console.log(">>>>>>>> obj.todos", obj.todos)
    //
    // delete obj.Todo[2]
    //
    // console.log(">>>>>>>> obj.todos", obj.todos)
    //
    // obj.Todo[1].completed = true
    //
    // console.log(">>>>>>>> obj.todos", obj.todos)
    //
    // obj.a = 500
  })
})
