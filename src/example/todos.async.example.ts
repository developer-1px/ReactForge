import {createStore} from "../test/createStore.ts"

interface Todo {
  id: string
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

const auth = createAPI()

store.Todo = reducer({}, (on) => {
  on.ADD_TODO((title) => (state) => {
    const id = Math.random().toString(36).slice(2)
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

store.Todo = reducer({}, (on, effect) => {
  on.ADD_TODO((title) => (state) => {
    const id = Math.random().toString(36).slice(2)
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

  effect("xxx", (track) => {
    // const todo = track(state => state.Todo)
    // on.insert()
    // on.update()
    // on.delete()
  })

  // effect("유저정보가 갱신되면 Account에도 동기화하기", (track) => (state, dispatch) => {
  //   const accountId = track((state) => state.account?.id)
  //   const user = track((state) => state.User[accountId])
  //   if (!user) {
  //     return
  //   }
  //
  //   // runInAction??
  //   dispatch((state) => {
  //     if (!state.account) {
  //       return
  //     }
  //     state.account.display_name = user.display_name
  //     state.account.avatar_url = user.avatar_url
  //     state.account.space_id = user.space_id
  //   })
  //
  //   // or
  //   dispatch.계정정보_동기화(user)
  // })
})

store.Query.todos = reducer((state) => Object.values(state.Todo).sort((a, b) => a.id.localeCompare(b.id)))

store.Query.filteredTodos = reducer((state) => state.Query.todos.filter((todo) => todo.completed))
