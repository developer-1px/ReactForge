# ComponentStore 

## Overview

ComponentStore is a modern state management library for React, designed to offer a more granular and flexible approach to managing state across components. It enables developers to create separate state management contexts for different parts of their application, reducing the complexity and enhancing the reusability of components.

## Key Features

- **Separate State Contexts:** Enables the creation of separate state contexts (`Providers`) for different components or component groups.
- **Reduced Props Drilling:** By leveraging `Providers`, the need for prop drilling is significantly reduced, leading to cleaner and more maintainable code.
- **Enhanced Reusability:** Components become more reusable and maintainable, as their state management is more self-contained.
- **Flexible State Sharing:** Allows for flexible state sharing and interactions between different state contexts, making it suitable for complex state management scenarios.

## Usage

### Setting Up ComponentStore

1. **createComponentStore** Manages the state of individual todo items.

```tsx
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
})
```



2. **createStore:** Manages the state of the entire todo list.

```tsx

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
})

```


### Implementing Components

1. **TodoList Component:** Uses `TodoListProvider` to manage the list.

```tsx
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
```

2. **TodoItem Component:** Manages its own state using `TodoProvider`.

```tsx
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
```

---
/* 여기에 TodoItem의 컴포넌트가 복잡해지면서 기존에는 props-drill이 발생하지만 여기에서는 그렇지 않다는 것을 통해서 뷰 변경의 자유로움을 보여주는 내용과 예시를 추가하자 */

### 기존 방식의 Props Drilling 문제

- Props를 생성하고 전달하고 특히 Props Type 지정이 너무 괴롭다.
- 추후에 디자인 변경에 따른 컴포넌트 구조 변경이 어려워짐.

```tsx
interface TodoItem {
  id: string
  text: string
  completed: boolean
}

// TodoList 컴포넌트
function TodoList() {
  const [todos, setTodos] = useState([{id: "1", text: "Learn React", completed: false}])

  const toggleTodo = (id: string) => {
    // 투두 아이템 상태 변경 로직
  }

  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
      ))}
    </ul>
  )
}

// TodoItem의 Props 타입
type TodoItemProps = {
   todo: TodoItem
   onToggle: (id: string) => void
}

// TodoItem 컴포넌트
function TodoItem({todo, onToggle}: TodoItemProps) {
  return (
    <li>
      <TodoText text={todo.text} />
      <TodoCheckbox completed={todo.completed} onToggle={() => onToggle(todo.id)} />
    </li>
  )
}

// TodoText 컴포넌트
function TodoText({text}: {text: string}) {
  return <span>{text}</span>
}

// TodoCheckbox 컴포넌트
function TodoCheckbox({completed, onToggle}: {completed: boolean; onToggle: () => void}) {
  return <input type="checkbox" checked={completed} onChange={onToggle} />
}

export default TodoList
```

### ComponentStore를 사용한 해결 방법

`ComponentStore`를 사용하면, 각 `TodoItem` 컴포넌트는 자체적으로 상태를 관리할 수 있으며, 상위 컴포넌트로부터 많은 `props`를 전달받을 필요가 없어집니다.

```tsx
// TodoItemStore 설정
const useTodoApp = createStore<...>(...)
const [TodoProvider, useTodo] = createComponentStore<...>(...)

// TodoList 컴포넌트
function TodoList() {
  const {todos, dispatch} = useTodoApp()

  const addTodo = (text) => {
    const newId = generateUniqueId()
    dispatch.ADD_TODO(newId)
  }

  return (
    <>
      <input type="text" onKeyPress={(e) => e.key === "Enter" && addTodo(e.target.value)} />
      <ul>
        {todos.map((id) => (
          <TodoProvider key={id} id={id}>
            <TodoItem />
          </TodoProvider>
        ))}
      </ul>
    </>
  )
}

// TodoItem 컴포넌트
function TodoItem() {
  return (
    <li>
      <TodoText />
      <TodoCheckbox />
    </li>
  )
}

// TodoText 컴포넌트
function TodoText() {
  const {text} = useTodo()
  return <span>{text}</span>
}

// TodoCheckbox 컴포넌트
function TodoCheckbox() {
  const {completed, dispatch} = useTodo()
  const toggleTodo = dispatch.TOGGLE_TODO()
  return <input type="checkbox" checked={completed} onChange={toggleTodo} />
}
```

이 예제에서 `ComponentStore`를 사용하면 `TodoItem` 내부의 `TodoText`와 `TodoCheckbox` 컴포넌트가 상위 컴포넌트로부터 직접 `props`를 전달받지 않고도 필요한 상태에 접근할 수 있습니다. 이로 인해 `Props Drilling` 문제가 해결되고, 컴포넌트 구조가 더 간결하고 유지보수하기 쉬워집니다.



---

## Key Advantages

- **Granular State Management:** The use of separate `Providers` for the todo list and individual todo items allows for more detailed and controlled state management.
- **Independent State Management:** Each provider manages its own state independently, reducing inter-component dependencies and enhancing maintainability.
- **Flexible and Efficient State Interactions:** The ability to have different state contexts interact with each other provides a powerful tool for managing complex state behaviors in large-scale applications.

In conclusion, ComponentStore provides an innovative approach to state management in React applications. It emphasizes modularity, reusability, and flexibility, making it an ideal choice for developers looking to streamline their state management practices in complex applications.