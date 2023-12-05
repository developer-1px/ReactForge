import {createComponentStore} from "componentstore"

interface TodoList {
  todos: TodoItem[] // Array of todo item IDs
}

interface TodoListActions {
  ADD_TODO(id: string): void
}

export const [TodoListProvider, useTodoListStore] = createComponentStore<TodoList, TodoListActions>(({store, reducer}) => {
  store.todos = reducer([], (on) => {
    on.ADD_TODO((id) => (state) => {
      const newTodo = createTodoItem(id)
      state.todos.push(newTodo)
    })
  })
})
