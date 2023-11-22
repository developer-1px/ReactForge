import {createAPI} from "../api/apiForge.ts"

const auth = createAPI()

export const setupTodo = (store, reducer) => {
  console.log("initTodo! 2222")

  const {dispatch} = store

  store.Todos = reducer({}, (on) => {
    on.ADD_TODO((state) => (title) => {
      const id = Math.random().toString(36).slice(2)
      const newTodo = {id, title, completed: false}
      state.Todos[id] = newTodo

      // @FIXME: How?? Effect?? Async??
      auth.POST["/todos"](newTodo).then((res) => {
        const todo = res.item
        delete state.Todos[id]
        state.Todos[todo.id] = todo
      })
    })

    on.ADD_TODO.FAILURE((error) => {
      console.error(error)
    })

    on.UPDATE_TODO((state) => (id, patch) => {
      state.Todos[id] = {...state.Todos[id], ...patch}

      // @FIXME: How?? Effect?? Async??
      return auth.PATCH["/todos/:id"](id, patch)
    })

    on.UPDATE_TODO.SUCCESS(() => {})
    on.UPDATE_TODO.FAILURE(() => {})

    on.TOGGLE_TODO((state) => (id) => (state.Todos[id].completed = !state.Todos[id].completed))

    on.REMOVE_ALL((state) => () => (state.Todos = {}))
  })

  store.todos = reducer((state) => Object.values(state.Todos).sort((a, b) => a.id.localeCompare(b.id)))

  store.filteredTodos = reducer((state) => state.todos.filter((todo) => todo.completed))
}

console.log("HMR: todos.example.ts")
