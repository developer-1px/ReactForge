import {createComponentStore} from "../test/newStore.ts"

//
// Todo
// -----------------------------------------------------------------------------------------------------------------
const db = {
  Todo: {} as Record<PropertyKey, Todo>,
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

export const [useTodoStore, TodoItemProvider] = createComponentStore<Todo, TodoActions>(({store, reducer, key}) => {
  // store.id = key

  store.text = reducer("", (on) => {
    on.SET_TEXT((text) => (state) => (state.text = text))
  })

  store.completed = reducer(false, (on) => {
    on.TOGGLE(() => (state) => (state.completed = !state.completed))
  })
}, db.Todo)

//
// Todo List
// -----------------------------------------------------------------------------------------------------------------

interface TodoList {
  todos: Todo[]
  num_todos: number
  num_completed_todos: number
}

interface TodoListActions {
  ADD_TODO(id: string, text: string): void
}

export const [useTodoListStore] = createComponentStore<TodoList, TodoListActions>(({store, reducer}) => {
  // reducer
  store.todos = reducer((state) => {
    return Object.values(db.Todo)
  })

  // computed value
  store.num_todos = reducer((state) => state.todos.length)

  store.num_completed_todos = reducer((state) => state.todos.filter((todo) => todo.completed).length)

  store.Todo = reducer(db.Todo, (on) => {
    on.ADD_TODO((id, text) => (state) => {
      db.Todo[id] = {id, text, completed: false}
    })
  })

  store.test = reducer(0, (on) => {
    on.ADD_TODO(() => (state) => state.test++)
  })
})

//
//
//
// -----------------------------------------------------------------------------------------------------------------

function TodoItem() {
  const {id, text, completed, dispatch} = useTodoStore()

  const toggleTodo = () => dispatch.TOGGLE()

  return (
    <li className="pointer" style={{textDecoration: completed ? "line-through" : "none"}} onClick={toggleTodo}>
      {id} - {text}
    </li>
  )
}

export default function TodoList() {
  const {todos, num_todos, dispatch} = useTodoListStore("todoListStore")

  const generateUniqueId = () => Math.random().toString(36).slice(2)

  const addTodo = (text: string) => {
    const newId = generateUniqueId()
    dispatch.ADD_TODO(newId, text)
  }

  return (
    <>
      <div>num_todos: {num_todos}</div>
      <input type="text" onKeyDown={(e) => e.key === "Enter" && addTodo(e.target.value)} />
      <ul>
        {todos.map((todo) => (
          // extra value들도 넘길수 있으면 좋겠다. index같은...
          <TodoItemProvider key={todo.id} id={todo.id}>
            <TodoItem />
          </TodoItemProvider>
        ))}
      </ul>
    </>
  )
}
