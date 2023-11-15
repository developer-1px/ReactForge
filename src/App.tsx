import "./App.css"
import {store} from "./store"


const useQuery = (query) => {
  return {
    isFetching,
    data: {}
  }
}


function App() {
  const {useSelect, dispatch} = store

  const count = useSelect(state => state.count)

  const 증가 = () => dispatch.INCREASE()

  return (
    <>
      <div className="card">
        <button onClick={증가}>
          count is {count}
        </button>
      </div>
    </>
  )
}

export default App
