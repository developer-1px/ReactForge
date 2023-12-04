store.dispatch.내_캘린더_만들기 = ({summary, backgroundColor, description = "", acl = []}) => {
  const calendar = await create_calendars({summary, backgroundColor, description})
  const calendarId = calendar.id

  const {items} = await fetch_calendars_acl(calendarId)
  const organization = items.find((r) => r.scope.type === "organization")
  const grid = items.find((r) => r.scope.type === "grid")

  if (!organization?.id) {
    throw new Error("[_내_캘린더_만들기] organization has not id.")
  }

  await Promise.all([
    ...acl.map((acl) => {
      const {scope, role} = acl

      if (scope.type === "organization") {
        return patch_calendars_acl(calendarId, organization.id, {role})
      }

      if (scope.type === "grid") {
        return patch_calendars_acl(calendarId, grid.id, {role})
      }

      return insert_calendars_acl(calendarId, acl)
    }),
  ])

  return calendar
}

interface State {
  Query: {}
}

store.Query.useCalendarList = (params) =>
  useQuery({
    key: (cache) => cache.calendarList,
    fn: () => api.GET["/calendarList"](params),
    select: (res) => res.items || [],
    retry: 3,
  })

store.Query.useCalendarListItem = (id) =>
  useQuery({
    key: (cache) => cache.calendarList[id],
    fn: () => api.GET["/calendarList/:id"](id),
    select: (res) => res.items || [],
    dedupingStrategy: "cancel", // or "skip", "queue", ""
    retry: 3,
  })

const {Query} = useStore()

const calendarList = Query.useCalendarList({lastKey: 10})

if (calendarList.isLoading) return

on(_API_FETCH_CALENDAR_LIST)
  .mergeMap((request) =>
    dispatch(
      _API_FETCH_CALENDAR_LIST.REQUEST,
      fetch_calendarList(request).map((result) => result.items || [])
    )
  )
  .createEffect()
