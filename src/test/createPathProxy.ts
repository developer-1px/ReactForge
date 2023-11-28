export const PathSymbol = Symbol("path")

export const ReflectGet = (target, prop, ...args) => (target === Object(target) ? Reflect.get(target, prop, ...args) : target?.[prop])

export const ReflectSet = (target, prop, ...args) => (target === Object(target) ? Reflect.set(target, prop, ...args) : false)

export const getValueFromPath = <T>(root: T, path: string[]): object => {
  return path.reduce((acc, prop) => acc && acc[prop], root) as object
}

const handleProxy = (getValue, override: ProxyHandler) => {
  return new Proxy(
    {},
    {
      get(target, p) {
        if (override[p]) return override[p]
        return (_, ...args) => {
          let value = getValue()
          value = Object(value) !== value ? Object.create(null) : value
          return Reflect[p](value, ...args)
        }
      },
    }
  )
}

const targetMap = new WeakMap()
const memo = <T>(target: object, value: T): T => targetMap.get(target) || void targetMap.set(target, value) || value

export const createPathProxy = <T extends object>(root: T, fn: () => ProxyHandler<T>): T => {
  const handlers = fn()

  const createPathProxySub = <T extends object>(target: T, path: string[] = []) => {
    const get = () => getValueFromPath(root, path)

    const override = {} //Object.create(null)
    Object.entries(handlers).forEach(([key, value]) => {
      override[key] = value(path)
    })
    if (override.get) {
      const getter = override.get
      override.get = (...args) => {
        const prop = args[1]

        if (prop === PathSymbol) {
          return [...path, prop].join(".")
        }
        if (prop === "valueOf") {
          return () => getValueFromPath(root, path)
        }
        if (typeof prop !== "string") {
          return ReflectGet(getValueFromPath(root, path), ...args.slice(1))
        }

        const next = getter(...args)
        return next && typeof next === "object" ? memo(next, createPathProxySub(next, [...path, prop.toString()])) : next
      }
    }

    return new Proxy(target, handleProxy(get, override)) as T
  }

  return createPathProxySub(root)
}
