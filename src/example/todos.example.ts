import {createStore} from "../test/newStore.ts"

interface Todo {
  id: number
  title: string
  completed: boolean
}

type VisibilityFilter = "SHOW_ALL" | "SHOW_ACTIVE" | "SHOW_COMPLETED"

interface State {
  Query: {
    todos: Todo[]
    filteredTodos: Todo[]
    numRemainingTodos: number
  }
  Todo: Record<string, Todo>

  visibilityFilter: VisibilityFilter
}

interface Actions {
  ADD_TODO(title: string): void
  TOGGLE_TODO(id: string): void
  REMOVE_TODO(id: string): void
  REMOVE_ALL(): void
  CLEAR_COMPLETED(): void
}

const {store, reducer} = createStore<State, Actions>()

store.Todo = reducer({}, (on) => {
  on.ADD_TODO((title) => (state) => {
    const id = Date.now()
    state.Todo[id] = {id, title, completed: false}
  })

  on.TOGGLE_TODO((id) => (state) => {
    state.Todo[id].completed = !state.Todo[id].completed
  })

  on.REMOVE_TODO((id) => (state) => {
    delete state.Todo[id]
  })

  on.REMOVE_ALL(() => (state) => {
    state.Todo = {}
  })

  on.CLEAR_COMPLETED(() => (state) => {
    state.Query.todos.filter((todo) => todo.completed).forEach((todo) => delete state.Todo[todo.id])
  })
})

store.Query.todos = reducer((state) => Object.values(state.Todo).sort((a, b) => a.id - b.id))

store.Query.filteredTodos = reducer((state) => {
  if (state.visibilityFilter === "SHOW_ACTIVE") {
    return state.Query.todos.filter((todo) => !todo.completed)
  }

  if (state.visibilityFilter === "SHOW_COMPLETED") {
    return state.Query.todos.filter((todo) => todo.completed)
  }

  return state.Query.todos
})

store.Query.numRemainingTodos = reducer((state) => state.Query.todos.filter((todo) => !todo.completed).length)
