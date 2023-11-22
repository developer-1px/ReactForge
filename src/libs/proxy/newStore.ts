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

interface State {
  Todo: Record<string, Todo>

  todos: Todo[]
  filteredTodos: Todo[]
}

interface Actions {
  ADD_TODO(title: string): void
}

export const {store, dispatch, reducer, useStore, subscribe} = createStore<Actions, State>()

window.store = store
console.log("HMR: store")
