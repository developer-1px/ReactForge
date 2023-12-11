import {createStore} from "../test/newStore.ts"
import {memo} from "react"

interface State {
  count: number
  doubledCount: number
  onlyUp: number
  noDeps: number
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

  store.noDeps = reducer(0, (on) => {
    on.INCREASE((by) => (state) => (state.noDeps += by))
    on.DECREASE((by) => (state) => (state.noDeps -= by))
    on.RESET(() => (state) => (state.noDeps = 0))
  })

  store.doubledCount = reducer((state) => state.count * 2)
})

function Counter() {
  console.log("Counter1: re-render")

  const {dispatch, count, doubledCount, version} = useStore("counter")

  const 증가 = () => dispatch.INCREASE(1)

  const 감소 = () => dispatch.DECREASE(1)

  const 초기화 = () => dispatch.RESET()

  return (
    <>
      <div>
        <button onClick={증가}>
          count is {count} : {version}
        </button>
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

  const {onlyUp, dispatch, version} = useStore("counter")

  const 증가 = () => dispatch.INCREASE(1)

  const 감소 = () => dispatch.DECREASE(1)

  return (
    <>
      <div>
        <button onClick={증가}>
          onlyUp is {onlyUp}: {version}
        </button>
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
