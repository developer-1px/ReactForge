import {createStore} from "../test/createStore.ts"
import {memo} from "react"

interface State {
  count: number
  doubledCount: number
  onlyUp: number
}

interface Actions {
  INCREASE(by: number): void
  DECREASE(by: number): void
  RESET(): void
}

const useStore = createStore<State, Actions>(({store, reducer}) => {
  store.count = reducer(0, (on) => {
    on.INCREASE((by) => (state) => (state.count += by))
    on.DECREASE((by) => (state) => (state.count -= by))
    on.RESET(() => (state) => (state.count = 0))
  })

  store.onlyUp = reducer(0, (on) => {
    on.INCREASE((by) => (state) => (state.onlyUp += by))
  })

  store.doubledCount = reducer((state) => state.count * 2)
})

function Counter() {
  console.log("Counter1: re-render")

  const {dispatch, count, doubledCount} = useStore("counter")

  const 증가 = () => dispatch.INCREASE(1)

  const 감소 = () => dispatch.DECREASE(1)

  const 초기화 = () => dispatch.RESET()

  return (
    <>
      <div>
        <button onClick={증가}>count is {count}</button>
        <button onClick={증가}>doubledCount is {doubledCount}</button>
        <button onClick={증가}>+</button>
        <button onClick={감소}>-</button>
        <button onClick={초기화}>RESET</button>
      </div>

      <CounterSubComponent />
    </>
  )
}

const CounterSubComponent = memo(() => {
  console.log("CounterSubComponent: re-render")

  const {onlyUp, dispatch} = useStore("counter")

  const 증가 = () => dispatch.INCREASE(1)

  const 감소 = () => dispatch.DECREASE(1)

  return (
    <>
      <div>
        <button onClick={증가}>onlyUp is {onlyUp}</button>
        <button onClick={증가}>+</button>
        <button onClick={감소}>-</button>
      </div>
    </>
  )
})

export default function CounterApp() {
  console.log("CounterApp: re-render")

  return (
    <div>
      <Counter />
    </div>
  )
}
