import {createAPI, createResponse} from "./apiForge"
import {fetchAdapter} from "./adapter/fetchAdapter"

type Response<T> = createResponse<{
  status:number,
  data:T
}>

interface Calendar {
  id:string
  name:string
}

interface Post {
  id:string
}

interface Comment {
  id:string
}

interface API_Post {
  GET:{
    ["/posts/recommend"](query:{lastKey:number}):Response<{lastKey:number, list:Post[]}>
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
  adapter: fetchAdapter()
})