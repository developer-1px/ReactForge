interface Actions {
  INCREASE(by: number): void
  DECREASE(by: number): void
  RESET(): void // Reset shouldn't take a parameter.
}

type On<Actions, State> = {
  [K in keyof Actions]: (arg: Actions[K] extends (arg: infer U) => void ? U : never) => State
}

const reducer = <T>(init: T, fn: (on: On<Actions, T>, state: T) => void) => {
  let state: T

  const dispatch = {} as Actions

  return [() => state, dispatch] as const
}

const [count, dispatch] = reducer(0, (on, count) => {
  on.INCREASE((by) => count + by)
  on.DECREASE((by) => count - by)
  on.RESET((by) => 0)
})

const c = reducer(0, (on) => {
  on.INCREASE((by) => (count) => count + by)
})
