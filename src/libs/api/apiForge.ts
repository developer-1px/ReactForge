export interface HttpConfig {
  baseURL:string
  headers:Record<string, string>
  timeout:number
  config:Record<string, unknown>
  adapter:(config:Record<string, unknown>, method:string, path:string, argumentsList:unknown[]) => void
}

const createAPIPathProxy = <T>(config:HttpConfig, method:string, path:string):T => new Proxy(Function, {
  get(_, prop:string) {
    if (prop === "toString") return () => path
    return createAPIPathProxy(config, method, path + prop)
  },

  async apply(_, __, argumentsList) {

    // 동적 경로 파라미터를 처리하기 위한 정규 표현식
    const dynamicPathRegex = /:[^/?]+|\([^)]+\)|\{[^)]+}|\[[^]+]|<[^>]+>/g

    // 경로에 있는 동적 파라미터 (:param)를 인자 값으로 치환
    const resolvedPath = path.replace(dynamicPathRegex, (paramName) => {
      const value = argumentsList.shift()

      if (value === undefined) {
        throw new Error(`Missing value for path parameter '${paramName}'`)
      }
      if (typeof value !== "number" && typeof value !== "string") {
        throw new Error(`Parameter type must be string or number '${paramName}'`)
      }
      return encodeURIComponent(value)
    })

    // baseURL과 resolvedPath 사이의 슬래시 처리
    const hasTrailingSlash = config.baseURL.endsWith("/")
    const hasLeadingSlash = resolvedPath.startsWith("/")
    let url = config.baseURL

    // 둘 다 슬래시가 없으면 추가
    if (!hasTrailingSlash && !hasLeadingSlash) {
      url += "/"
    }
    // 둘 다 슬래시가 있으면 하나 제거
    else if (hasTrailingSlash && hasLeadingSlash) {
      url = url.slice(0, -1)
    }

    url += resolvedPath

    // body와 queryString
    let body = null
    let queryString = null

    // GET 요청의 경우, params를 쿼리 스트링으로 변환
    if (method !== "GET" && method !== "HEAD") {
      body = argumentsList.shift()
    }

    const params = Object.assign(Object.create(null), ...argumentsList)
    queryString = new URLSearchParams(params).toString()

    // URL에 이미 쿼리 스트링이 있으면 '&'를 사용, 없으면 '?'를 사용
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString
    }

    return config.adapter(config, method, url, body)
  }
}) as T

const defaultConfig:HttpConfig = {
  baseURL: "/",
  headers: {"Content-Type": "application/json"},
  timeout: 0,
  config: {}
}

export const createAPI = <T>(config:Partial<HttpConfig>):T => new Proxy(Object.create(null), {
  get: (_, method:string) => createAPIPathProxy({...defaultConfig, ...config}, method.toUpperCase(), "")
})

export const createAPIAdapter = (fn:(config:HttpConfig, method:string, url:string, data:unknown) => Promise<unknown>) => {
  return fn
}

interface APIResponse<T> extends Response {
  data:T
  config:HttpConfig
  request:RequestInit
}

export type createResponse<T> = Promise<APIResponse<T>>