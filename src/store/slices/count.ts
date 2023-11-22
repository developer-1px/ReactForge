import {createSlice} from "../@forge.ts"
import {store} from "../index.ts"

store.count = createSlice(100, on => {
  on.INCREASE(amount =>
    set(count => {
      console.warn(">>>>>>>>>>>", {count, amount})
      return count + amount
    })
  )

  on.DECREASE(() => set(count => count - 1))
})
