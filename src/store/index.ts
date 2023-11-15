import {items, visibilityFilter} from "./slices/etc.ts"
import {createStore} from "./@forge.ts"
import {filteredTodos, todos} from "./slices/todos.ts"
import count from "./slices/count.ts"

const middleware = (store) => (next) => (type, args) => {
  console.group(type+"(", ...args, ")")
  const res = next(type, args)
  console.groupEnd()
  return res
}

export const store = createStore({
  account: {
    id: "",
    email: "",
    name: "",
  },

  todos,
  visibilityFilter,
  items,
  count,

  Query: {
    filteredTodos,
    remainTodoCount: 0,
  },
}, middleware)