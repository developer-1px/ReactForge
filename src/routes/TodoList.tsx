import {createComponentStore, createStore} from "../test/newStore.ts"

//
// User
// -----------------------------------------------------------------------------------------------------------------
const account = {id: "accountId"}

interface User {
  id: string
  name: string
}

const UserRepo = {} as Record<PropertyKey, User>

//
// Todo
// -----------------------------------------------------------------------------------------------------------------
interface Todo {
  id: string
  text: string
  completed: boolean
  creatorId: string
}

interface TodoExtra {
  creator?: User
  수정권한이_있는가: false
}

interface TodoActions {
  TOGGLE(): void
  SET_TEXT(text: string): void
}

export const [useTodo, TodoProvider, TodoRepo] = createComponentStore<Todo, TodoActions, TodoExtra>(({store: Todo, reducer, key}) => {
  // Todo.id = key

  Todo.text = reducer("", (on) => {
    on.SET_TEXT((text) => (state) => (state.text = text))
  })

  Todo.completed = reducer(false, (on) => {
    on.TOGGLE(() => (state) => (state.completed = !state.completed))
  })

  // extra Example
  Todo.creator = reducer((state) => UserRepo[state.creatorId])
  Todo.수정권한이_있는가 = reducer((state) => state.creatorId === account.id)
})

//
// Todo List
// -----------------------------------------------------------------------------------------------------------------

interface TodoApp {
  Todo: Record<PropertyKey, Todo>

  todos: Todo[]
  num_todos: number
  num_completed_todos: number
}

interface TodoAppActions {
  ADD_TODO(id: string, text: string): void
  REMOVE_TODO(id: string): void
}

export const useTodoApp = createStore<TodoApp, TodoAppActions>(({store, reducer}) => {
  // Repository
  store.Todo = reducer(TodoRepo, (on) => {
    on.ADD_TODO((id, text) => (state) => {
      state.Todo[id] = {id, text, completed: false, creatorId: "tmp"}
    })

    on.REMOVE_TODO((id) => (state) => {
      delete state.Todo[id]
    })
  })

  // computed value
  store.todos = reducer((state) => Object.values(state.Todo).filter(Boolean))

  store.num_todos = reducer((state) => state.todos.length)

  store.num_completed_todos = reducer((state) => state.todos.filter((todo) => todo.completed).length)

  // effect
  // when(() => {

  // }, cond))

  // when(cond, () => {

  // })

  // effect("xxxx", (state) => {
  //
  // })

  // middleware
  // store.dispatch.ADD_TODO = (id, text) => [id, text, account.id]
})

//
//
// React
// -----------------------------------------------------------------------------------------------------------------
function TodoItem() {
  const {id, text, completed, dispatch} = useTodo()
  const app = useTodoApp()

  const toggleTodo = () => dispatch.TOGGLE()
  const removeTodo = () => app.dispatch.REMOVE_TODO(id)

  return (
    <li className="hbox pointer" style={{textDecoration: completed ? "line-through" : "none"}} onClickCapture={toggleTodo}>
      <div>
        {id} - {text}
      </div>
      <button onClickCapture={removeTodo}>삭제</button>
    </li>
  )
}

export default function TodoList() {
  const {todos, num_todos, dispatch} = useTodoApp()

  const generateUniqueId = () => Math.random().toString(36).slice(2)

  const addTodo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === "Enter") {
      const text = e.currentTarget.value
      const newId = generateUniqueId()
      dispatch.ADD_TODO(newId, text)

      e.currentTarget.value = ""
    }
  }

  return (
    <>
      <div>num_todos: {num_todos}</div>
      <input type="text" onKeyDownCapture={addTodo} />
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
