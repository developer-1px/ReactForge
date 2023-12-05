function TodoItem() {
  const {text, completed, dispatch} = useTodoItemStore()

  const toggleTodo = () => dispatch.TOGGLE()

  return (
    <li style={{textDecoration: completed ? "line-through" : "none"}} onClick={toggleTodo}>
      {text}
    </li>
  )
}
