import "./App.css"
import {createStore} from "./test/createStore.ts"

interface State {
  count: number
  doubledCount: number
}

interface Actions {
  INCREASE(by: number): void
  DECREASE(by: number): void
  RESET(): void
}

const {store, reducer, useStore} = createStore<State, Actions>()

console.warn("createStore", store)

store.count = reducer(0, (on) => {
  on.INCREASE((by) => (state) => (state.count += by))
  on.DECREASE((by) => (state) => (state.count -= by))
  on.RESET(() => (state) => (state.count = 0))

  // on(on.INCREASE, on.DECREASE, on.RESET)((type, payload) => (state) => {
  //
  // })
  //
  // // @NOTE: 이벤트가 삭제되었다면 상세창을 닫는다.
  // // UI로 인해 삭제되었는지, 아니면 서버로부터 삭제되었는지는 알 수 없기에 250ms 뒤에 한번 더 체크 후 닫는다.
  // on(store.activeEvent)((event) => (state) => {
  //   if (!event) return
  //   await delay(250)
  //   GET(store.activeEvent)
  //   state.is_show_event_detail$ = false
  // })
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

  return (
    <>
      <div className="card">
        <button onClick={증가}>ffxxxff count is {count}</button>
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
