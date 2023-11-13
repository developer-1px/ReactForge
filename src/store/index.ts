import {createStore} from "./@schema.ts"
import {filteredTodos, todos} from "./todos"
import {items, visibilityFilter} from "./etc"
import count from "./count.ts"


export const store = createStore({
  account: {
    id:"",
    email:"",
    name:"",
  },

  todos,
  visibilityFilter,
  items,
  count,

  query: {
    filteredTodos
  },
})