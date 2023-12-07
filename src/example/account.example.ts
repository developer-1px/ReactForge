import {createStore} from "../test/newStore.ts"

interface User {
  id: string
  email: string
  display_name: string
  avatar_url: string
  space_id: string
  grid?: {
    id: string
  }
}

interface Account extends User {}

interface State {
  User: Record<string, User>

  account: Account | null
  그룹사_기능_사용중인가: boolean
  타_그룹사인가(userId: string): boolean
}

interface Actions {
  API_FETCH_CALENDAR_LIST_SUCCESS(calendarList: Array): void
  계정정보조회하기_SUCCESS(account: Account): void
  계정정보_동기화(user: User): void
}

export default createStore<State, Actions>(({store, reducer}) => {
  //
  store.account = reducer(
    (state) => {
      if (!state.account) {
        return null
      }

      const user = state.User[state.account.id]
      if (user) {
        state.account.display_name = user.display_name
        state.account.avatar_url = user.avatar_url
      }

      return state.account
    },
    (on) => {
      //
      on.API_FETCH_CALENDAR_LIST_SUCCESS((calendarList) => (state) => {
        if (state.account) return

        const id = calendarList.find((c) => c.primary)?.kakaoworkUserId
        if (!id) return

        state.account = {
          id,
          email: "",
          display_name: "",
          avatar_url: "",
          space_id: "",
        }
      })

      on.계정정보조회하기_SUCCESS((account) => (state) => (state.account = account))
    }
  )

  store.타_그룹사인가 = reducer((state) => (userId: string) => {
    const account = state.account
    if (!account) return false

    const space_id = state.User[userId]?.space_id
    if (!space_id) {
      return false
    }

    return space_id !== account.space_id
  })

  store.그룹사_기능_사용중인가 = reducer((state) => !!state.account?.grid?.id)
})
