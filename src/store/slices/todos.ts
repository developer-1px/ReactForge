import {createQuery, createSelector, createSlice} from "../@forge.ts"

export const todos = createSlice(store => store.todos, [], ({on, set, draft, insert, remove, toggle}) => {

  on.ADD_TODO(text => {

    const newTodo = {id: Date.now(), text, completed: false}
    // insert(newTodo)

    console.log("ADD_TODO 777 888")
    console.log({newTodo})

    // draft.push(newTodo)
  })

  on.TOGGLE_TODO(id => {
    // const todo = draft.find(todo => todo.id === id)!
    // todo.completed = !todo.completed

    // toggle(todo => todo.id === id, todo => todo.completed)
  })

  on.REMOVE_TODO((id) => {
    // remove(todo => todo.id === id)
    // set(todos => todos.filter(todo => todo.id !== id))
  })

  on.REMOVE_ALL_DONE(() => set(todos => todos.filter(todo => !todo.completed)))
})

export const filteredTodos = createSelector((state) => {
  if (state.visibilityFilter === "SHOW_ACTIVE") {
    return state.todos.filter(todo => todo.completed)
  }
  return state.todos
})

export const queryEventsByDate = createQuery((date:string) => store => [store.todos, store.visibilityFilter], ([todos, visibilityFilter]) => {

  if (visibilityFilter === "SHOW_ACTIVE") {
    return todos.filter(todo => todo.completed)
  }

  return todos
})


// const events = queryEventsByDate("2013-7")




