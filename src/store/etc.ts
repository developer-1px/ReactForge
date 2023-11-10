import {createEffect, createSlice} from "./index.ts"


export const items = createSlice(store => store.items, {}, ({on, draft}) => {

  console.log("items! 222")

  on.댓글창_열기(id => draft[id].isShowReply = true)

  on.댓글창_닫기(id => draft[id].isShowReply = false)
})


export const visibilityFilter = createSlice(store => store.visibilityFilter, "SHOW_ALL", ({on, set}) => {

  console.log("visibilityFilter! 2222")

  on.SET_VISIBILITY_FILTER(set)
})


// 상태가 바뀔 때 마다 호출된다.
export const effect = createEffect(({path, prev, value}) => {
  console.log(path, prev, value)
})