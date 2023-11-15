import {createSlice} from "../@forge.ts"

export default createSlice(store => store.count, 100, ({on, set}) => {

  on.INCREASE(amount => set(count => {


    console.warn(">>>>>>>>>>>", {count, amount})
    return count + amount


  }))

  on.DECREASE(() => set(count => count - 1))
})
