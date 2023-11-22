import {createSlice} from "../@forge.ts"

export const searchSuggests = createSlice(store => store.searchSuggests, [], (({on}) => {

  on.검색어_입력((searchText) => {
    if (searchText) {
      return selector(state => state.suggests[searchText].user)
    }
    return []
  })

  on.검색결과에_추가(() => [])
})



export const suggests = createSlice(store => store.suggests, [], (({on, draft}) => {

  on.멤버_채팅방_검색하기.pipe(
    distinctUntilChanged(),
    filter(Boolean),
  )(keyword => {
    ["user", "conversation", "department"].forEach(name => {
      if (!draft[keyword][name]) {

        const a = Array(keyword.length - 1)
        .fill(0)
        .map((_, i) => keyword.slice(0, -i - 1))
        .map(prefix => SELECT(db.suggests[prefix][name]))

        const o = Observable.of(null).withLatestFrom(...a).map(arr => arr.find(Boolean) ?? []).filter(arr => arr.length > 0)

        draft[keyword][name] = o
      }
    })
  })

  on.멤버_채팅방_검색하기.pipe(
    distinctUntilChanged(),
    filter(Boolean),
  )(async (q) => {

    const res = await dispatch.멤버_채팅방_검색하기.REQUSET(q, fetch_suggest_members(q).then(async res => {
      // @NOTE: 멤버 조회의 경우, 상세유저정보를 가져오기 위해 별도로 조회
      const user_ids = (res.collections as UserCollection[])
      .filter(c => c.name === "members")
      .flatMap<UserDoc>(c => c.items)
      .filter(row => row.doc_type === "user")
      .map(row => row.item?.id)
      .filter(Boolean)
      await fetch_kakaowork_users(user_ids)
      return res
    })

    const {keyword, collections} = res

    // @FIXME: Type 정리!!
    const r2:(UserDoc | ConversationDoc)[] = collections.map(collection => collection.items).flat()
    const r = array_group_by((item:UserDoc | ConversationDoc) => item.doc_type)(r2)
    r["user"] = r["user"] || []
    r["conversation"] = r["conversation"] || []
    r["department"] = r["department"] || []

    for (const [name, items] of Object.entries(r)) {
      const value = items
      .map(i => i?.item)
      .filter(Boolean)
      .map(item => {
        item.display_name = item.title || item.name || item.display_name
        item.display_department = item.subtitle
        item.avatar_url = item.avatar_url || item.image_url
        item.users_count = item.users_count || item.user_count
        return item
      })
      .pipe(array_unique(a => a.id))

      draft[keyword][name] = value
    }
  })

})