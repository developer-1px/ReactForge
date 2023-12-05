# ComponentStore 

## Overview

ComponentStore is a modern state management library for React, designed to offer a more granular and flexible approach to managing state across components. It enables developers to create separate state management contexts for different parts of their application, reducing the complexity and enhancing the reusability of components.

## Key Features

- **Separate State Contexts:** Enables the creation of separate state contexts (`Providers`) for different components or component groups.
- **Reduced Props Drilling:** By leveraging `Providers`, the need for prop drilling is significantly reduced, leading to cleaner and more maintainable code.
- **Enhanced Reusability:** Components become more reusable and maintainable, as their state management is more self-contained.
- **Flexible State Sharing:** Allows for flexible state sharing and interactions between different state contexts, making it suitable for complex state management scenarios.

## Usage

### Setting Up Providers

1. **TodoItemProvider:** Manages the state of individual todo items.

```tsx
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoItemActions {
  TOGGLE(): void
  SET_TEXT(text: string): void
}

export const [TodoItemProvider, useTodoItemStore, createTodoItem] = createComponentStore<TodoItem, TodoItemActions>(({store, reducer, key}) => {
  
  store.id = key 

  store.text = reducer("", (on) => {
    on.SET_TEXT((text) => (state) => (state.text = text))
  })

  store.completed = reducer(false, (on) => {
    on.TOGGLE(() => (state) => (state.completed = !state.completed))
  })
})
```



2. **TodoListProvider:** Manages the state of the entire todo list.

```tsx
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
```


### Implementing Components

1. **TodoList Component:** Uses `TodoListProvider` to manage the list.

   ```tsx
   function TodoList() {
     const { todos, dispatch } = useTodoListStore();

     const addTodo = (text) => {
       const newId = generateUniqueId();
       dispatch.ADD_TODO(newId);
     };

     return (
       <TodoListProvider>
         <input type="text" onKeyPress={(e) => e.key === 'Enter' && addTodo(e.target.value)} />
         <ul>
           {todos.map(id => (
             <TodoItemProvider key={id} id={id}>
               <TodoItem />
             </TodoItemProvider>
           ))}
         </ul>
       </TodoListProvider>
     );
   }
   ```

2. **TodoItem Component:** Manages its own state using `TodoItemProvider`.

   ```tsx
   function TodoItem() {
     const { text, completed, dispatch } = useTodoItemStore();

     const toggleTodo = () => {
       dispatch.TOGGLE();
     };

     return (
       <li
         style={{ textDecoration: completed ? 'line-through' : 'none' }}
         onClick={toggleTodo}
       >
         {text}
       </li>
     );
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
const [TodoListProvider, useTodoListStore] = createComponentStore<...>(...)
const [TodoItemProvider, useTodoItemStore] = createComponentStore<...>(...)

// TodoList 컴포넌트
function TodoList() {
  const {todos, dispatch} = useTodoListStore()

  const addTodo = (text) => {
    const newId = generateUniqueId()
    dispatch.ADD_TODO(newId)
  }

  return (
    <TodoListProvider>
      <input type="text" onKeyPress={(e) => e.key === "Enter" && addTodo(e.target.value)} />
      <ul>
        {todos.map((id) => (
          <TodoItemProvider key={id} id={id}>
            <TodoItem />
          </TodoItemProvider>
        ))}
      </ul>
    </TodoListProvider>
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
  const {text} = useTodoItemStore()
  return <span>{text}</span>
}

// TodoCheckbox 컴포넌트
function TodoCheckbox() {
  const {completed, dispatch} = useTodoItemStore()
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