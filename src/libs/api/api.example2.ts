import {createResponse} from "./apiForge.ts"

interface Post {
  id:string
  title:string
  comments:Comment[]
}

interface Comment {
  id:string
}

interface Calendar {
  id:string
  name:string
}

type Response<T> = createResponse<{
  status:number,
  data:T
}>

export interface API_Calendar {
  GET:{
    ["/calendars"]():Response<Calendar[]>
    ["/calendars/:calendarId"](calendarId:string):Response<Calendar>
  }

  POST:{
    ["/calendars"](calendarId:string, body:Calendar, query:{lastKey:string}):Response<Calendar>
  }

  PUT:{
    ["/calendars/:calendarId"]():Response<Calendar>
  }

  DELETE:{
    ["/calendars/:calendarId"]():Response<Calendar>
  }
}

type API = API_Calendar

const api = {} as API_Calendar

const useREST = <T>(fn:(api:API) => T) => {
  const status = "idle"
  const data = {} as T
  const isFetching = false
  const isLoading = false
  const isError = false

  const $ = {} as T
  const invalidate = () => {}

  const refetch = () => {}

  const fns = fn(api)

  return {
    status,
    data,
    isFetching,
    isLoading,
    isError,

    invalidate,
    refetch,

    ...fns,
  }
}

const params = {}


const useQuery = (fn:Function) => fn

const useCalendars = () => useREST( api => {

  return {
    FETCH: useQuery(api.GET["/calendars"]),
    RECOMMENDS: api.GET["/calendars"],
    GET: api.GET["/calendars/:calendarId"],

    POST: api.POST["/calendars"],
    DELETE: api.DELETE["/calendars/:id"],
    TALK: api.POST["/calendars/:id/talk"]
  }
})

const calendars$ = useCalendars()

const id = "111312321"

// const calendars = calendars$.GET(id)
// const recommends = calendars$.RECOMMENDS()
//
// calendars.isFetching
// calendars.isLoading
// calendars.isError
// calendars.status
// calendars.data
//
// calendars$.invalidate()
// calendars$.refetch()

const handleTest = () => {
  const params = {id, name}

  calendars$.POST(id, params, (err, res) => {
    if (err) {
      /// @TODO: reset
    }
    // calendars$[id].set(params)
    calendars$.invalidate()
  })
}

// createSelector(state)
// calendars$.DELETE(postId)


const id
const title

const createNewPost = () => {
  calendars.POST({id, title})
}

const updatePost = () => {
  calendars.$[103020].PUT({title})
}


const recommend = useREST(api => api.calendars.recommend)