import {type Collection, createStateForge} from "../libs/stateForge"

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

  Query:{
    filteredTodos:Array<Todo>
    remainTodoCount:number
  }
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
  items:Collection<ShortView>
  visibilityFilter:VisibilityFilter
  count:number
}

export interface Actions {
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

export const {
  createSlice,
  createEffect,
  createQuery,
  createSelector,
  createStore
} = createStateForge<Actions, State>("app")