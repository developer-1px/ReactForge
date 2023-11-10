import {filteredTodos, todos} from "./todos"
import {configureStore} from "./index"
import {items, visibilityFilter} from "./etc.ts"

export const store = configureStore({
  todos,
  visibilityFilter,

  section: {
    filteredTodos
  },

  items,
})