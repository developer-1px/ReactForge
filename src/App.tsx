import "./App.css"
import {dispatch, reducer, store, subscribe, useStore} from "./deprecated/proxy/newStore.ts"

store.count = reducer(0, (on) => {
  on.INCREASE((state) => (by) => {
    state.count += 1
  })

  on.DECREASE((state) => (by) => (state.count -= by))

  on.RESET((state) => () => (state.count = 0))
})

store.count2 = reducer(20, (on) => {
  on.INCREASE2((state) => (by) => (state.count2 += by))

  on.DECREASE2((state) => (by) => (state.count2 -= by))

  on.RESET2((state) => () => (state.count2 = 0))
})

store.sum = reducer((state) => state.count + state.count2)

store.timer = 0

subscribe((...args) => {
  console.log(args)
})

function Counter2() {
  console.log("Counter2: re-render")

  const count2 = useStore((state) => state.count2)
  const count2 = state.count2

  const 증가 = () => dispatch.INCREASE2(1)

  const 감소 = () => dispatch.DECREASE2(5)

  const 초기화 = () => dispatch.RESET2()

  return (
    <>
      <div className="card sddd">
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
  const sum = state.sum

  const 증가 = () => dispatch.INCREASE(1)

  const 감소 = () => dispatch.DECREASE(1)

  const 초기화 = () => dispatch.RESET()

  return (
    <>
      <div className="card">
        <button onClick={증가}>count is {count}</button>
        <button onClick={증가}>sum is {sum}</button>
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
      <Counter2 />
    </>
  )
}

export default App
