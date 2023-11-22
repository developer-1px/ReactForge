import "./App.css"
import {dispatch, reducer, store, subscribe, useStore} from "./libs/proxy/newStore.ts"
import {useEffect} from "react"

store.count = reducer(0, on => {
  on.INCREASE(state => by => (state.count += by))

  on.DECREASE(state => by => (state.count -= by))

  on.RESET(state => () => (state.count = 0))
})

const createCounter = () =>
  reducer(0, on => {
    on.INCREASE(set => by => set(count => count + by))

    on.DECREASE(set => by => set(count => count + by))

    on.RESET(set => () => set(0))
  })

store.count = createCounter()
store.count2 = createCounter()

store.count2 = reducer(0, on => {
  on.INCREASE(state => by => (state.count2 += by))

  on.DECREASE(state => by => (state.count2 -= by))

  on.RESET(state => () => (state.count2 = 0))
})

store.timer = 0

subscribe(() => {
  console.warn("root!!!! subscrrive")
})

function Counter2() {
  console.log("Counter2: re-render")

  const state = useStore()
  const count2 = state.count2

  const 증가 = () => dispatch.INCREASE(5)

  const 감소 = () => dispatch.DECREASE(5)

  const 초기화 = () => dispatch.RESET()

  return (
    <>
      <div className="card">
        <button onClick={증가}>count is {count2}</button>
        <button onClick={증가}>+</button>
        <button onClick={감소}>-</button>
        <button onClick={초기화}>RESET</button>
      </div>
    </>
  )
}

function Counter() {
  console.log("Counter: re-render")

  const state = useStore()
  const count = state.count

  const 증가 = () => dispatch.INCREASE(5)

  const 감소 = () => dispatch.DECREASE(5)

  const 초기화 = () => dispatch.RESET()

  return (
    <>
      <div className="card">
        <button onClick={증가}>count is {count}</button>
        <button onClick={증가}>+</button>
        <button onClick={감소}>-</button>
        <button onClick={초기화}>RESET</button>
      </div>
    </>
  )
}

function App() {
  console.log("App: re-render")

  return (
    <>
      {/*<Timer />*/}
      <Counter />
      {/*<Counter2 />*/}
    </>
  )
}

export default App
