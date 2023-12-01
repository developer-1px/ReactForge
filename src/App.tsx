import "./App.css"
import {createStore} from "./test/createStore.ts"
import {useEffect} from "react"

interface State {
  count: number
  doubledCount: number
}

interface Actions {
  INCREASE(by: number): void
  DECREASE(by: number): void
  RESET(): void
}

const logger = (api) => (next) => (action) => {
  const {type, payload} = action
  console.group(type + "(", ...payload, ")")
  console.groupCollapsed("(callstack)")
  console.trace("")
  console.groupEnd()
  next(action)
  console.log(api.getState())
  console.groupEnd()
}

const {store, reducer, useStore} = createStore<State, Actions>({
  middleware: logger,
})

store.count = reducer(0, (on, effect) => {
  on.INCREASE((by) => (state) => (state.count += by))
  on.DECREASE((by) => (state) => (state.count -= by))
  on.RESET(() => (state) => (state.count = 0))

  effect("[count] localStorage에서 불러오기", (track) => (state, dispatch) => {
    const count = localStorage.getItem("count")
    if (count) {
      dispatch((state) => (state.count = +count))
    }
  })

  effect("[count] localStorage에 저장하기", (track) => (state) => {
    const count = track((state) => state.count)
    localStorage.setItem("count", count)
  })
})

store.count2 = reducer(0, (on) => {
  on.INCREASE2((by) => (state) => (state.count2 += by))
  on.DECREASE2((by) => (state) => (state.count2 -= by))
  on.RESET2(() => (state) => (state.count2 = 0))
})

store.doubledCount = reducer((state) => state.count * 2)

function Counter2() {
  console.log("Counter2: re-render")

  const {count2, dispatch} = useStore("counter2")

  const 증가 = () => dispatch.INCREASE2(1)

  const 감소 = () => dispatch.DECREASE2(1)

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
  const {dispatch, count, doubledCount} = useStore("counter")

  const 증가 = () => dispatch.INCREASE(1)

  const 감소 = () => dispatch.DECREASE(1)

  const 초기화 = () => dispatch.RESET()

  useEffect(() => dispatch("@@init"), [])

  return (
    <>
      <div className="card">
        <button onClick={증가}>count is {count}</button>
        <button onClick={증가}>doubledCount is {doubledCount}</button>
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
      <h1>Hello, world</h1>
      {/*<Timer />*/}
      <Counter />
      <Counter2 />
    </>
  )
}

export default App
