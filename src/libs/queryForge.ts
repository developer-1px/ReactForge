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

export interface FetchCalendarEventInputOptions {
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


interface Resource {
  calendars:{
    ():Calendar[]
    [id:string]:{
      ():Calendar
      events:{
        (params:FetchCalendarEventInputOptions):CalendarEvent[]
        [id:string]:() => CalendarEvent
      }
    }
  }
  calendarList:{
    ():Calendar[]
    [id:string]:() => Calendar
  }
  posts:{
    ():Post[]
    recommend(params:{lastKey?:number}):Post[]
  }
}

interface Http {
  GET:Resource
  POST:Resource
  PUT:Resource
  PATCH:Resource
  DELETE:Resource
}

const http:Http = {} as Http

const {GET, PUT, DELETE} = http


const calendarId = "sxu3k39d"

const useFetch = <T>(resource:T) => Promise<T>

// GET /api/auth/v0/kakaowork/calendars

const calendars = useFetch(GET.calendars())

// GET /api/auth/v0/kakaowork/calendars/${calendarId}
const calendar = useFetch(GET.calendars[calendarId]())

// GET /api/auth/v0/kakaowork/calendars/${calendarId}
const calendarEvents = useFetch(GET.calendars[calendarId].events({singleEvents: true}))

// PUT /api/auth/v0/kakaowork/calendarList/${calendar.id}?colorRgbFormat=true
const res = await useFetch(PUT.calendars[calendarId]())

// DELETE /api/auth/v0/kakaowork/calendars/${calendarId}
const res = await useFetch(DELETE.calendars[calendarId]())

// GET https://uc-api.ep.oror.io/api/posts/recommend?lastKey=${lastKey}
const res = await useFetch(GET.posts.recommend({lastKey: 100}))


