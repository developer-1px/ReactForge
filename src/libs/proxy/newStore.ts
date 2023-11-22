import {createStore} from "./lib.ts"

interface State {
  count: number
}

interface Actions {
  INCREASE(by: number): void
  DECREASE(by: number): void
  RESET(): void
}

interface Todo {
  id: string
  title: string
  completed: boolean
}

type VisibilityFilter = "SHOW_ALL" | "SHOW_COMPLETED" | "SHOW_ACTIVE"

interface State {
  Query: {
    todos: Array<Todo>
    filteredTodos: Array<Todo>
    numRemainingTodos: number
  }

  Todo: Record<string, Todo>

  visibilityFilter: VisibilityFilter
}

interface Actions {
  ADD_TODO(title: string): void
  TOGGLE_TODO(id: number): void
  UPDATE_TODO(title: string): void
  REMOVE_TODO(id: number): void

  REMOVE_ALL(): void
  CLEAR_COMPLETED(): void

  SET_VISIBILITY_FILTER(filter: VisibilityFilter): void
}

export const {store, dispatch, reducer, useStore, subscribe} = createStore<Actions, State>()

window.store = store
console.log("HMR: store")
