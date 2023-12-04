import {createComponentStore, createStore} from "../test/createStore.ts"

interface CounterState {
  count: number
  doubledCount: number
}

interface CounterActions {
  INCREASE(by: number): void
  DECREASE(by: number): void
  RESET(): void
}

interface App {
  counter: Record<string, CounterState>
}

const [CounterProvider, useCounterComponentStore] = createComponentStore<CounterState, CounterActions, App>(({store, reducer}) => {
  store.count = reducer(0, (on) => {
    on.INCREASE((by) => (state) => (state.count += by))
    on.DECREASE((by) => (state) => (state.count -= by))
    on.RESET(() => (state) => (state.count = 0))
  })

  store.doubledCount = reducer((state) => state.count * 2)
})

function Counter() {
  console.log("Counter1: re-render")
  const {count, doubledCount} = useCounterComponentStore()

  return (
    <>
      <div>
        <div>count is {count}</div>
        <div>doubledCount is {doubledCount}</div>
      </div>

      <CounterControl />
    </>
  )
}

function CounterControl() {
  console.log("Counter1: re-render")

  const {dispatch} = useCounterComponentStore()

  const 증가 = () => dispatch.INCREASE(1)

  const 감소 = () => dispatch.DECREASE(1)

  const 초기화 = () => dispatch.RESET()

  return (
    <>
      <div>
        <button onClick={증가}>+</button>
        <button onClick={감소}>-</button>
        <button onClick={초기화}>RESET</button>
      </div>
    </>
  )
}

export default function CounterStoreApp() {
  console.log("CounterApp: re-render")

  return (
    <div>
      <h1>ComponentStore</h1>

      <CounterProvider id="1">
        <Counter />
      </CounterProvider>

      <CounterProvider id="1">
        <Counter />
      </CounterProvider>
    </div>
  )
}
