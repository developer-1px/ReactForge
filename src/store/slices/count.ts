import {createSlice} from "../@forge.ts"

export default createSlice(store => store.count, 100, ({on, set}) => {

  on.INCREASE(() => set(count => count + 1))

  on.DECREASE(() => set(count => count - 1))
})
