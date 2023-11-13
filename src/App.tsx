import reactLogo from "./assets/react.svg"
import viteLogo from "/vite.svg"
import "./App.css"
import {api} from "./libs/queryForge.ts"
import {useEffect} from "react"
import {store} from "./store"


function App() {
  const {useSelect, dispatch} = store

  const count = useSelect(state => state.count)

  const addTodo = () => dispatch.ADD_TODO("askdlfjaksldfj")

  const 증가 = () => dispatch.INCREASE()

  const 댓글 = () => dispatch.댓글창_닫기("111")

  useEffect(() => {
    async function getPosts() {
      const posts = await api.GET.posts.recommend({lastKey:100, inc:"222", x:100})
      console.log({posts})
      console.log("posts.data", posts.data)
    }
    void getPosts()
  }, [])

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo"/>
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo"/>
        </a>
      </div>
      <h1 onClick={addTodo}>Vite + React iekeke</h1>
      <div className="card">
        <button onClick={증가}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
