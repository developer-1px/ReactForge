import { createSlice } from "../../store/@forge.ts"
import { createSelector } from "../@forge.ts"

export const searchResult = createSlice(
  (store) => store.searchResult,
  [],
  ({ on, draft }) => {
    on.검색결과에_추가((member) => {
      if (!member) return
      draft[member.id] = {
        ...member,
        kakaoworkUserId: member.id,
        timestamp: +new Date(), // 이거 비순수 함수인데??
      }
    })

    on.검색결과_삭제((member) => {
      draft[member.id] = undefined
    })

    on.검색결과_전체_삭제.or.동료캘린더_칩_전체_삭제({})
  }
)

export const lnb_searchResult = createSelector((state) => {
  return entitiy(state.searchResult).orderBy((a, b) => b.timestamp! - a.timestamp!)
})
