import {createStore} from "./@forge.ts"
import {primaryCalendarId$} from "./slices/calendarList.ts"

const middleware = (store) => (next) => (type, args) => {
  console.group(type + "(", ...args, ")")
  const res = next(type, args)
  console.groupEnd()
  return res
}

export const store = createStore(
  {
    primaryCalendarId$,
  },
  middleware
)
