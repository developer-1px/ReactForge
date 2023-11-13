import {Collection} from "../libs/stateForge"
import {TestActions} from "./slices/etc.ts"

export interface Todo {
  id:number
  text:string
  completed:boolean
  testComputedValue:string
}

export interface Account {
  id:string
  email:string
  name:string
}

export interface Database {
  Todo:Todo
}

export type VisibilityFilter = "SHOW_ALL"|"SHOW_COMPLETED"|"SHOW_ACTIVE"

export interface ShortView {
  id:number
  isShowReply:boolean
  isShowEndingCard:boolean
  isShowVote:boolean
  isShowAnswer:boolean
}

export interface State {
  account:Account

  todos:Array<Todo>
  visibilityFilter:VisibilityFilter

  items:Collection<ShortView>

  count:number

  Query:{
    filteredTodos:Array<Todo>
    remainTodoCount:number
  }
}

export interface Actions extends TestActions {
  ADD_TODO(text:string):void
  TOGGLE_TODO(id:number):void
  REMOVE_TODO(id:number):void
  REMOVE_ALL_DONE():void
  SET_VISIBILITY_FILTER(filter:VisibilityFilter):void
}

export interface Actions {
  INCREASE():void
  DECREASE():void
}