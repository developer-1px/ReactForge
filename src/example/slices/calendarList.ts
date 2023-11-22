import {ellipsis, isDesktop, isMobile} from "src/const"
import {database, DELETE, dispatch, GET, on, reducer, SELECT, story, UPDATE} from "src/libs/adorable"
import {delete_calendarList, patch_calendarList} from "src/services/api/auth/provider/CalendarList"
import {_API_FETCH_CALENDAR_LIST, _SHOW_TOAST, _동료캘린더_칩_전체_삭제, _이_캘린더만_보기, _자주찾는그룹_멤버_캘린더_색상_설정, _캘린더_구독_취소, _캘린더_모두_체크_토글, _캘린더_색상_설정, _캘린더_체크, _캘린더_토글} from "src/state/actions"
import {db} from "src/state/db"
import {sort_캘린더정렬} from "src/state/pipe/sorter/sorter"
import {selected_groups$} from "src/state/store/favorite_groups/groups"
import type {CalendarListEntry} from "src/types"
import {createSelector, createSlice} from "../@forge.ts"

export const calendarList$ = createSlice(
  (store) => store.calendarList,
  [],
  (({on})) => {

    SELECT(db.calendarList).orderBy(sort_캘린더정렬).writeTo(setSelf)

    on.API_FETCH_CALENDAR_LIST.SUCCESS((calendarList) => {
      const prev = {...GET(db.calendarList)}

      calendarList.forEach((calendar) => {
        const calendarId = calendar.id
        const {kakaoworkUserId} = calendar

        delete prev[calendarId]

        // @NOTE: mobile에서 서버와 동기화 되지 않음.
        if (isMobile) {
          // @NOTE: "818a9c1a66bb9ec31a85e53233b993a0"는 암웨이 공용 캘린더이다. 모든 직원이 볼 수 있도록 만들어달라는 요구사항으로 인해 하드코딩 되어 있다.
          calendar.selected = GET(db.calendarList[calendarId].selected) || calendar.primary || calendar.id === "818a9c1a66bb9ec31a85e53233b993a0"
        }
        UPDATE(db.calendarList[calendarId]).set(calendar)

        // primary 캘린더Id와 kakaoworkUserId 매칭
        if (calendar.calendar.primary && kakaoworkUserId) {
          UPDATE(db.calendars[calendarId].primary).set(calendar.calendar.primary)
          UPDATE(db.calendars[calendarId].kakaoworkUserId).set(kakaoworkUserId)
          UPDATE(db.kakaoworkUsers[kakaoworkUserId].calendarId).set(calendar.id)
        }
      })

      Object.keys(prev).forEach((calendarId) => DELETE(db.calendarList[calendarId]))
    })

    if (isDesktop) {
      on.캘린더_체크
        .mergeMap(({calendarId, selected}) =>
          dispatch(_캘린더_체크.REQUEST, () => {
            UPDATE(db.calendarList[calendarId].selected).set(selected)
            return patch_calendarList(calendarId, {selected})
          })
        )
        .createEffect()

      // @FIXME: 리듀서가 아니라 story로 빠져야 한다.
      on.캘린더_토글
        .mergeMap((calendarId) =>
          dispatch(_캘린더_토글.REQUEST, () => {
            const selected = UPDATE(db.calendarList[calendarId].selected).update((selected) => !selected)
            return patch_calendarList(calendarId, {selected})
          })
        )
        .createEffect()

      on.캘린더_모두_체크_토글
        .mergeMap((calendarList) =>
          dispatch(_캘린더_모두_체크_토글.REQUEST, () => {
            const selected = !calendarList.some((calendar) => calendar.selected)
            calendarList.forEach((calendar) => UPDATE(db.calendarList[calendar.id].selected).set(selected))
            return Promise.all(calendarList.map((calendar) => patch_calendarList(calendar.id, {selected})))
          })
        )
        .createEffect()
    }

    if (isMobile) {
      on.캘린더_체크(({calendarId, selected}) => UPDATE(db.calendarList[calendarId].selected).set(selected))

      on.캘린더_토글((calendarId) => UPDATE(db.calendarList[calendarId].selected).update((selected) => !selected))

      on.캘린더_모두_체크_토글((calendarList) => {
        const selected = !calendarList.some((calendar) => calendar.selected)
        calendarList.forEach((calendar) => UPDATE(db.calendarList[calendar.id].selected).set(selected))
      })

      on.동료캘린더_칩_전체_삭제(() => {
        calendarList$.value.filter((c) => c.selected).forEach((calendar) => UPDATE(db.calendarList[calendar.id].selected).set(false))
      })
    }

    on.캘린더_색상_설정.pipe(
      groupBy(({calendar}) => calendar.id),
      mergeMap((g) =>
        g.switchMap(({calendar, backgroundColor}) =>
          dispatch.캘린더_색상_설정.REQUEST(
            transaction(() => {
              root.calendarList[calendar.id].backgroundColor = backgroundColor
              root.colors[calendar.id].backgroundColor = backgroundColor
              return patch_calendarList(calendar.id, {backgroundColor})
            })
          )
        )
      )
    )

    on.자주찾는그룹_멤버_캘린더_색상_설정
      .switchMap(({member, backgroundColor}) => {
        const calendarId = root.kakaoworkUsers[member.id].calendarId
        const calendar = root.calendarList[calendarId]
        if (!calendar) return

        return dispatch.자주찾는그룹_멤버_캘린더_색상_설정.REQUEST({calendarId, backgroundColor}, () => {
          root.calendarList[calendarId].backgroundColor = backgroundColor
          return patch_calendarList(calendarId, {backgroundColor})
        })
      })
      .createEffect()


    const use캘린더_구독_취소 = () => {
      return useMutation((calendarId) => auth.DELETE["calendarList/:calendarId"], {
        onMutate(calendarId) {
          const calendar = root.calendarList[calendarId]
          delete root.calendarList[calendarId]
          return calendar
        },
        onSuccess() {

        },
        onError() {

        },
        onSettled() {
          queryClient.invalidateQueries("calendars")
        }
      })
    }

    const {isLoading, isError, isFetching} = usePending(dispath.캘린더_구독_취소)

    on.캘린더_구독_취소.pipe(
      groupBy((v) => v),
      mergeMap((g) =>
        g.exhaustMap((calendarId) =>
          dispatch(캘린더_구독_취소.REQUEST({calendarId}), async () => {
            const calendar = root.calendarList[calendarId]
            delete root.calendarList[calendarId]
            await delete_calendarList(calendarId)
            return calendar
          })
        )
      )
    )

    on.캘린더_구독_취소.SUCCESS((calendar) => {
      const summary = ellipsis(calendar.summary)

      dispatch.SHOW_TOAST({
        msg: "''{summary}'' 캘린더를 구독 취소했습니다.",
        options: {values: {summary}},
      })
    })
  }
)

const Component = () => {

  // const {isFetching} = usePening(dispatch.캘린더_구독_취소)
  //
  // const handleTest = () => {
  //   if (!isFetching) dispatch.캘린더_구독_취소()
  // }
}

export const primaryCalendar$ = createSelector(calendarList$, (calendarList) =>
  return calendarList.find((calendar) => calendar.primary)
})

export const oldSelectedCalendarList$ = reducer<CalendarListEntry[]>([], "[calendarList] oldSelectedCalendarList$", (setSelf) => {
  const makeKey = (a: CalendarListEntry[]) =>
    a
      .map((a) => a.summary)
      .sort()
      .join("\n")

  calendarList$
    .map((calendarList) => calendarList.filter((calendar) => calendar.selected))
    .distinctUntilChanged((a, b) => makeKey(a) === makeKey(b))
    .writeTo(setSelf)
})

export const primaryCalendarId$ = createSelector<string>(
  store => store.primaryCalendarId$,
  from(primaryCalendar).map((calendar) => calendar.id)
)


export const defaultCalendarId$ = reducer<string>(undefined, "[calendarList] defaultCalendarId$ - 주/월 기본생성 캘린더ID", (defaultCalendarId$) => {
  calendarList$.map((calendarList) => calendarList.find((c) => (c.accessRole === "owner" || c.accessRole === "delegator" || c.accessRole === "writer") && c.selected)?.id ?? primaryCalendarId$.value).writeTo(defaultCalendarId$)
})

story("이 캘린더만 보기", () => {
  on(_이_캘린더만_보기)
    .waitFor(oldSelectedCalendarList$, selected_groups$)
    .switchMap(([calendar, selectedCalendarList, selected_groups]) =>
      dispatch(_이_캘린더만_보기.REQUEST, async () => {
        selectedCalendarList.forEach((selectedCalendar) => database(`/calendarList/${selectedCalendar.id}/selected`).set(false))
        selected_groups.forEach((group) => database(`/favorite/groups/${group.id}/selected`).set(false))
        database(`/calendarList/${calendar.id}/selected`).set(true)

        // @TODO: 자동으로 할 수도 있지 않을까? 자찾그처럼?
        await Promise.all([...selectedCalendarList.map((selectedCalendar) => patch_calendarList(selectedCalendar.id, {selected: false}))])
        await patch_calendarList(calendar.id, {selected: true})
      })
    )
    .createEffect()
})
