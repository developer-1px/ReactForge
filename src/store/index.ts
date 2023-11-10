import {type Collection, createStateForge} from "../libs/stateForge"

export interface Todo {
  id:number
  text:string
  completed:boolean
}

export type VisibilityFilter = "SHOW_ALL"|"SHOW_COMPLETED"|"SHOW_ACTIVE"

interface Group {
  filteredTodos:Array<Todo>
  optionedTodos?:Array<Todo>
}

export interface ShortView {
  id:number
  isShowReply:boolean
  isShowEndingCard:boolean
  isShowVote:boolean
  isShowAnswer:boolean
}

export interface TodoState {
  todos:Array<Todo>
  items:Collection<ShortView>
  visibilityFilter:VisibilityFilter
  section: Group
}

export interface TodoActions {
  ADD_TODO(text:string):void
  TOGGLE_TODO(id:number):void
  REMOVE_TODO(id:number):void

  SET_VISIBILITY_FILTER(filter:VisibilityFilter):void
}

export const {
  createSlice,
  createEffect,
  createQuery,
  createSelector,
  configureStore
} = createStateForge<TodoActions, TodoState>("state")