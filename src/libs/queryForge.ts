interface Http<Resource> {
  GET:Resource
  POST:Resource
  PUT:Resource
  PATCH:Resource
  DELETE:Resource
}

interface HttpConfig {
  baseURL:string
  fetchOptions:{}
  headers: {}
}

const defaultConfig = {
  baseURL: "/",
  fetchOptions: {},
  headers: {}
}

const createAPIPathProxy = <T>(config:HttpConfig, method:string, path:string):T => new Proxy(Function, {
  get(_, prop:string) {
    if (prop === "toString") return () => path
    return createAPIPathProxy(config, method, path + "/" + prop)
  },

  async apply(_, __, argumentsList) {
    const params = Object.assign(Object.create(null), ...argumentsList)

    let url = `${config.baseURL}/${path}`
    let body = null

    // GET 요청의 경우, params를 쿼리 스트링으로 변환
    if (method === "GET") {
      const queryString = new URLSearchParams(params).toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    // POST, PUT 등의 요청에서는 body를 JSON.stringify로 처리
    else {
      if (config.headers["Content-Type"] === "multipart/form-data") {
        body = new FormData()
        for (const key in params) {
          body.append(key, params[key])
        }
      }
      else {
        body = JSON.stringify(params)
      }
    }

    // @TOOD:
    // 1. GET 일때는 params를 encodeded된 queryString으로 만들어서 URL로 만들기

    // 2. 그밖에서는 body를 JSON.stringify(data)

    // 3. config Content-type이 Form이라면 FormData를 이용해서...

    // fetch CALL
    const response = await fetch(url, {
      method: method.toUpperCase(), // 메소드 설정 (GET, PUT 등)
      headers: {"Content-Type": "application/json"},
      body,
      ...config.fetchOptions,
    })
    const json = response.json()
    if (!response.ok) {
      throw json
    }
    return json
  }
}) as T


// ========================

interface Calendar {
  id:string
  name:string
  // ...
}

interface CalendarList {
  id:string
  name:string
  // ...
}

interface CalendarEvent {
  id:string
  name:string
  // ...
}

interface Post {
  id:string
}

export interface FetchCalendarEventParams {
  kakaoworkUserId?:number
  singleEvents?:boolean
  maxResults?:number
  timeMin?:string
  timeMax?:string
  pageToken?:string
  syncToken?:string
  subscription?:boolean
  count?:number
  uuid?:string
  paging?:boolean
}

type Response<T> = Promise<{
  status:number,
  data:T
}>

interface Resource {
  calendars:{
    ():Response<Calendar[]>
    [id:string]:{
      ():Response<Calendar>
      events:{
        (params:FetchCalendarEventParams):Response<CalendarEvent[]>
        [id:string]:() => Response<CalendarEvent>
      }
    }
  }

  calendarList:{
    ():Response<Calendar[]>
    [id:string]:() => Response<Calendar>
  }

  posts:{
    ():Response<Post[]>
    recommend(params?:{lastKey?:number}):Response<Post[]>
  }
}

const createAPI = <Resource>(config:Partial<HttpConfig>):Http<Resource> => new Proxy(Object.create(null), {
  get: (_, method:string) => createAPIPathProxy({...defaultConfig, ...config}, method.toUpperCase(), "")
})

export const api = createAPI<Resource>({
  baseURL: "https://uc-api.ep.oror.io/api",
  fetchOptions: {}
})