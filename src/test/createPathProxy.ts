export const PathSymbol = Symbol("path")

export const isObject = (obj: unknown): obj is object => Object(obj) === obj

export const ReflectGet = (target, prop, ...args) => (target === Object(target) ? Reflect.get(target, prop, ...args) : target?.[prop])

export const ReflectSet = (target, prop, ...args) => (target === Object(target) ? Reflect.set(target, prop, ...args) : false)

export const getValueFromPath = <T>(root: T, path: string[]): object => {
  return path.reduce((acc, prop) => acc && acc.valueOf()[prop], root) as object
}

const handleProxy = (getValue, override: ProxyHandler) => {
  return new Proxy(
    {},
    {
      get(target, p) {
        if (override[p]) return override[p]
        return (_, ...args) => {
          let value = getValue()
          console.log(">>>>>>>>", p, value, ...args)

          value = Object(value) !== value ? {} : value
          return Reflect[p](value, ...args)
        }
      },
    }
  )
}

const proxyMap = new WeakMap()

export const canProxy = (x: unknown): x is object =>
  isObject(x) &&
  !(x instanceof Function) &&
  !(x instanceof Map) &&
  !(x instanceof Set) &&
  !(x instanceof WeakMap) &&
  !(x instanceof WeakSet) &&
  !(x instanceof Error) &&
  !(x instanceof Date) &&
  !(x instanceof RegExp) &&
  !(x instanceof ArrayBuffer)

const memo = <T>(target: object, value: T): T => proxyMap.get(target) ?? void proxyMap.set(target, value) ?? value

export const createPathProxy = <T extends object>(root: T, fn: () => ProxyHandler<T>): T => {
  const handlers = fn()

  const createPathProxySub = <T extends object>(target: T, path: string[] = []) => {
    const get = () => {
      const value = getValueFromPath(root, path)
      return value === undefined ? target : value
    }

    console.log({root, path}, target)

    const override = {} //Object.create(null)
    Object.entries(handlers).forEach(([key, value]) => {
      override[key] = value(path)
    })

    if (override.get) {
      const getter = override.get
      override.get = (target, ...args) => {
        const prop = args[0]

        if (prop === PathSymbol) {
          return [...path, prop].join(".")
        }
        if (prop === "valueOf") {
          return () => get()
        }
        if (typeof prop !== "string") {
          return ReflectGet(get(), ...args)
        }

        const next = getter(target, ...args)

        return canProxy(next) ? memo(next, createPathProxySub(next, [...path, prop.toString()])) : next
      }
    }

    return new Proxy(target, handleProxy(get, override)) as T
  }

  return createPathProxySub(root)
}
