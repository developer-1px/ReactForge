interface HttpConfig {
  baseURL:string
  headers:Record<string, string>
  timeout:number
  fetchOptions:RequestInit
}

const defaultConfig:HttpConfig = {
  baseURL: "/",
  headers: {"Content-Type": "application/json"},
  timeout: 0,
  fetchOptions: {},
}

class HttpError extends Error {
  constructor(public status:number, public message:string, public body:any) {
    super(`HTTP Error ${status}: ${message}`)
  }
}

const createAPIPathProxy = <T>(config:HttpConfig, method:string, path:string):T => new Proxy(Function, {
  get(_, prop:string) {
    if (prop === "toString") return () => path
    return createAPIPathProxy(config, method, path + prop)
  },

  async apply(_, __, argumentsList) {
    // 동적 경로 파라미터를 처리하기 위한 정규 표현식
    const dynamicPathRegex = /:([^/?])+/g

    // 경로에 있는 동적 파라미터 (:param)를 인자 값으로 치환
    const resolvedPath = path.replace(dynamicPathRegex, (_, paramName) => {
      const value = argumentsList.shift()
      if (value === undefined) {
        throw new Error(`Missing value for path parameter '${paramName}'`)
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
    if (method === "GET") {
      const params = Object.assign(Object.create(null), ...argumentsList)
      queryString = new URLSearchParams(params).toString()
    }
    else {
      const data = argumentsList.shift()
      if (data) {
        if (config.headers["Content-Type"] === "multipart/form-data") {
          body = new FormData()
          for (const key in data) {
            body.append(key, data[key])
          }
        }
        else {
          body = JSON.stringify(data)
        }
      }

      const params = Object.assign(Object.create(null), ...argumentsList)
      queryString = new URLSearchParams(params).toString()
    }

    // URL에 이미 쿼리 스트링이 있으면 '&'를 사용, 없으면 '?'를 사용
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString
    }


    // Timeout 처리
    const abortController = new AbortController()
    const timeoutId = config.timeout > 0 ? setTimeout(() => abortController.abort(), config.timeout) : null

    try {
      const request = {
        method: method.toUpperCase(),
        headers: {...config.headers},
        body,
        signal: abortController.signal,
        ...config.fetchOptions,
      }

      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: {...config.headers},
        body,
        signal: abortController.signal,
        ...config.fetchOptions,
      })
      clearTimeout(timeoutId)

      // response 자동추론
      const contentType = response.headers.get("Content-Type")
      let responseData
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json()
      }
      else {
        responseData = await response.text()
      }

      if (!response.ok) {
        throw new HttpError(response.status, response.statusText, responseData)
      }

      // @FIXME: 로깅 추가
      console.log(`API Call: ${method} ${url} - Status: ${response.status}`)

      return {
        ...response,
        data: responseData,
        config: config,
        request: {url, ...request}
      }
    }
    catch (error) {
      clearTimeout(timeoutId)
      if (error.name === "AbortError") {
        throw new Error("Request timed out")
      }
      else {
        throw error
      }
    }
  }
}) as T

const createAPI = <T>(config:Partial<HttpConfig>):T => new Proxy(Object.create(null), {
  get: (_, method:string) => createAPIPathProxy({...defaultConfig, ...config}, method.toUpperCase(), "")
})


// ========================

interface Calendar {
  id:string
  name:string
  // ...
}

interface Post {
  id:string
}

interface Comment {
  id:string
}

interface APIResponse<T> extends globalThis.Response {
  data:T
  config:HttpConfig
  request:RequestInit
}

type createResponse<T> = Promise<APIResponse<T>>

type Response<T> = createResponse<{
  status:number,
  data:T
}>

interface API_Post {
  GET:{
    ["/posts/recommend"]():Response<{lastKey:string, list:Post[]}>
    ["/posts/:postId"](postId:string):Response<Post>
    ["/posts/:postId/comments"](postId:string, params?:unknown):Response<Comment[]>
  }
}

interface API_Calendar {
  GET:{
    ["/calendars"]():Response<Calendar[]>
    ["/calendars/:calendarId"](calendarId:string):Response<Calendar>
  }

  POST:{
    ["/calendars/:calendarId"](calendarId:string, body:Calendar, q:{lastKey:string}):Response<Calendar>
  }

  PUT:{
    ["/calendars/:calendarId"]():Response<Calendar>
  }
}

type API
  = API_Post
  & API_Calendar


export const api = createAPI<API>({
  baseURL: "https://uc-api.ep.oror.io/api",
  fetchOptions: {}
})
