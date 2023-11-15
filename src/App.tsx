import "./App.css"
import {store} from "./store"


const useQuery = (query) => {
  return {
    // isFetching,
    // data: {}
  }
}


function App() {
  const {useSelect, useReaction, dispatch} = store

  const count = useSelect(state => state.count)

  const 증가 = () => dispatch.INCREASE(100)

  const 감소 = () => dispatch.DECREASE()

  useReaction(({on, when}) => {
    on.INCREASE(() => {

    })

    when(state => state.count > 10, () => {

    })
  })

  return (
    <>
      <div className="card">
        <button onClick={증가}>count is {count}</button>
        <button onClick={증가}>+</button>
        <button onClick={감소}>-</button>
      </div>
    </>
  )
}

export default App
