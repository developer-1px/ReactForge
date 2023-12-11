import {createComponentStore} from "../test/newStore.ts"

//
// Todo
// -----------------------------------------------------------------------------------------------------------------

interface Todo {
  id: string
  text: string
  completed: boolean
}

interface TodoActions {
  TOGGLE(): void
  SET_TEXT(text: string): void
}

export const [useTodo, TodoProvider, TodoRepo] = createComponentStore<Todo, TodoActions>(({store: Todo, reducer, key}) => {
  // Todo.id = key

  Todo.text = reducer("", (on) => {
    on.SET_TEXT((text) => (state) => (state.text = text))
  })

  Todo.completed = reducer(false, (on) => {
    on.TOGGLE(() => (state) => (state.completed = !state.completed))
  })
})

//
// Todo List
// -----------------------------------------------------------------------------------------------------------------

interface TodoList {
  Todo: Record<PropertyKey, Todo>

  todos: Todo[]
  num_todos: number
  num_completed_todos: number
}

interface TodoListActions {
  ADD_TODO(id: string, text: string): void
  REMOVE_TODO(id: string): void
}

export const [useTodoListStore] = createComponentStore<TodoList, TodoListActions>(({store, reducer}) => {
  // Repository
  store.Todo = reducer(TodoRepo, (on) => {
    on.ADD_TODO((id, text) => (state) => {
      state.Todo[id] = {id, text, completed: false}
    })

    on.REMOVE_TODO((id) => (state) => {
      delete state.Todo[id]
    })
  })

  // computed value
  store.todos = reducer((state) => Object.values(TodoRepo).filter(Boolean))

  store.num_todos = reducer((state) => state.todos.length)

  store.num_completed_todos = reducer((state) => state.todos.filter((todo) => todo.completed).length)
})

//
//
//
// -----------------------------------------------------------------------------------------------------------------

function TodoItem() {
  const {id, text, completed, dispatch} = useTodo()
  const store = useTodoListStore()

  const toggleTodo = () => dispatch.TOGGLE()
  const removeTodo = () => store.dispatch.REMOVE_TODO(id)

  return (
    <li className="hbox pointer" style={{textDecoration: completed ? "line-through" : "none"}} onClick={toggleTodo}>
      <div>
        {id} - {text}
      </div>
      <button onClick={removeTodo}>삭제</button>
    </li>
  )
}

export default function TodoList() {
  const {todos, num_todos, dispatch} = useTodoListStore("todoListStore")

  const generateUniqueId = () => Math.random().toString(36).slice(2)

  const addTodo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key !== "Enter") return

    const text = e.currentTarget.value
    const newId = generateUniqueId()
    dispatch.ADD_TODO(newId, text)

    e.currentTarget.value = ""
  }

  return (
    <>
      <div>num_todos: {num_todos}</div>
      <input type="text" onKeyDown={addTodo} />
      <ul>
        {todos.map((todo) => (
          // extra value들도 넘길수 있으면 좋겠다. index같은...
          <TodoProvider key={todo.id} id={todo.id}>
            <TodoItem />
          </TodoProvider>
        ))}
      </ul>
    </>
  )
}
