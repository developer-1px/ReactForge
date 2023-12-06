import {createComponentStore} from "../test/createStore.ts"

//
// Todo
// -----------------------------------------------------------------------------------------------------------------

const db = {
  Todo: {} as Record<string, Todo>,
}

db.Todo["1"] = {id: "1", text: "test1", completed: true}
db.Todo["2"] = {id: "2", text: "test123", completed: false}
db.Todo["3"] = {id: "3", text: "test456", completed: false}

interface Todo {
  id: string
  text: string
  completed: boolean
}

interface TodoActions {
  TOGGLE(): void
  SET_TEXT(text: string): void
}

export const [useTodoStore, TodoItemProvider, createTodo] = createComponentStore<Todo, TodoActions>(({store, reducer, key}) => {
  store.id = key

  store.text = reducer("", (on) => {
    on.SET_TEXT((text) => (state) => (state.text = text))
  })

  store.completed = reducer(false, (on) => {
    on.TOGGLE(() => (state) => (state.completed = !state.completed))
  })
})

//
// Todo List
// -----------------------------------------------------------------------------------------------------------------

interface TodoList {
  v: number
  todos: Todo[]
  num_todos: number
  num_completed_todos: number
}

interface TodoListActions {
  ADD_TODO(id: string, text: string): void
}

export const [useTodoListStore] = createComponentStore<TodoList, TodoListActions>(({store, reducer}) => {
  store.v = 0

  // reducer
  store.todos = reducer((state) => {
    return ["!23123123"]
  })

  // computed value
  store.num_todos = reducer((state) => state.todos.length)

  store.num_completed_todos = reducer((state) => state.todos.filter((todo) => todo.completed).length)
})

//
//
//
// -----------------------------------------------------------------------------------------------------------------

function TodoItem() {
  const {text, completed, dispatch} = useTodoStore()

  console.log(text)

  const toggleTodo = () => dispatch.TOGGLE()

  return (
    <li style={{textDecoration: completed ? "line-through" : "none"}} onClick={toggleTodo}>
      {text}
    </li>
  )
}

export default function TodoList() {
  const {todos, dispatch} = useTodoListStore("todoListStore")

  console.warn(">>>>>>>>>>>>>>>>>>> todos", todos)
  console.warn(">>>>>>>>>>>>>>>>>>> todos.map", todos.map)

  const generateUniqueId = () => Math.random().toString(36).slice(2)

  const addTodo = (text: string) => {
    const newId = generateUniqueId()
    dispatch.ADD_TODO(newId, text)
  }

  return (
    <>
      <input type="text" onKeyDown={(e) => e.key === "Enter" && addTodo(e.target.value)} />
      <ul>
        {todos.map((todo) => (
          <TodoItemProvider key={todo.id} id={todo.id}>
            <TodoItem />
          </TodoItemProvider>
        ))}
      </ul>
    </>
  )
}
