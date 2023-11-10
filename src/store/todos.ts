import {createQuery, createSelector, createSlice} from "./index"

export const todos = createSlice(store => store.todos, [], ({on, value, set, insert, remove, toggle}) => {

  on.ADD_TODO((text) => {
    const newTodo = {id: Date.now(), text, completed: false}
    // insert(newTodo)

    console.log("ADD_TODO 22222 3333")
    console.log({newTodo})
  })

  on.TOGGLE_TODO((id) => {
    // toggle(todo => todo.id === id, "completed")
  })

  on.REMOVE_TODO((id) => {
    // remove(todo => todo.id === id)
  })
})

export const filteredTodos = createSelector(
  store => store.section.filteredTodos,
  store => [store.todos, store.visibilityFilter],
  ([todos, visibilityFilter]) => {

    if (visibilityFilter === "SHOW_ACVITED") {
      return todos.filter(todo => todo.completed)
    }

    return todos
  })


export const queryEventsByDate = createQuery((date:string) => store => [store.todos, store.visibilityFilter], ([todos, visibilityFilter]) => {

  if (visibilityFilter === "SHOW_ACVITED") {
    return todos.filter(todo => todo.completed)
  }

  return todos
})


// const events = queryEventsByDate("2013-7")




