import {createStateForge} from "../libs/state/stateForge.ts"
import {Actions, State} from "./@schema"

export const {
  createSlice,
  createEffect,
  createQuery,
  createSelector,
  createStore
} = createStateForge<State, Actions>("app")