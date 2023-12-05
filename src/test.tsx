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
  const {completed, toggleTodo} = useTodoItemStore()
  return <input type="checkbox" checked={completed} onChange={toggleTodo} />
}
