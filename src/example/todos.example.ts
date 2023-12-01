import {store, reducer} from "../deprecated/proxy/newStore.ts"

store.Todo = reducer({}, (on) => {
  on.ADD_TODO((state) => (title) => {
    const id = Date.now().toString(36).slice(2)
    state.Todo[id] = {id, title, completed: false}
  })

  on.TOGGLE_TODO((state) => (id) => {
    state.Todo[id].completed = !state.Todo[id].completed
  })

  on.REMOVE_TODO((state) => (id) => {
    delete state.Todo[id]
  })

  on.REMOVE_ALL((state) => () => {
    state.Todo = {}
  })

  on.CLEAR_COMPLETED((state) => () => {
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
