import {store, reducer} from "../deprecated/proxy/newStore.ts"
import {createAPI} from "../libs/api/apiForge.ts"

const auth = createAPI()

store.Todo = reducer({}, (on) => {
  on.ADD_TODO((state) => (title) => {
    const id = Math.random().toString(36).slice(2)
    const newTodo = {id, title, completed: false}
    state.Todo[id] = newTodo

    // @FIXME: How?? Effect?? Async??
    auth.POST["/todos"](newTodo).then((res) => {
      const todo = res.item
      delete state.Todo[id]
      state.Todo[todo.id] = todo
    })
  })

  on.ADD_TODO.FAILURE((error) => {
    console.error(error)
  })

  on.UPDATE_TODO((state) => (id, patch) => {
    state.Todo[id] = {...state.Todo[id], ...patch}

    // @FIXME: How?? Effect?? Async??
    return auth.PATCH["/todos/:id"](id, patch)
  })

  on.UPDATE_TODO.SUCCESS(() => {})
  on.UPDATE_TODO.FAILURE(() => {})

  on.TOGGLE_TODO((state) => (id) => (state.Todo[id].completed = !state.Todo[id].completed))

  on.REMOVE_ALL((state) => () => (state.Todo = {}))
})

store.Query.todos = reducer((state) => Object.values(state.Todo).sort((a, b) => a.id.localeCompare(b.id)))

store.Query.filteredTodos = reducer((state) => state.Query.todos.filter((todo) => todo.completed))
