import {createStore} from "../test/createStore.ts"

interface CalendarEvent {}

interface State {
  activeEvent: CalendarEvent
  dispatch: Actions
}

interface Actions {
  반복일정상세조회(calendarId: string, recurringEventId: string): Promise<{calendarId: string; recurringEventId: string}>
}

const {store, reducer} = createStore<State, Actions>()

store.activeEvent = reducer(null, (on, effect) => {
  //
  // effect의 목적: state의 변화를 감지하고 원하는 action의 시점을 자동화
  // 사이드 이펙트는 action을 통해서 분리한다.
  // state를 변경하지 못하는 것은 아니나... 가급적 dispatch로 끝내는 것을 추천하다. (경고 삽업 예정!)
  effect("[공통][다이나믹패널] 선택된 일정의 반복주기를 조회하고 표기한다.", (track) => (state, dispatch) => {
    const [_originalCalendarId, recurringEventId] = track((state) => [
      state.activeEvent._originalCalendarId,
      state.activeEvent.recurringEventId,
      state.activeEvent.updated,
    ])
    if (!_originalCalendarId || !recurringEventId) {
      return
    }

    const {_originalCalendarId, recurringEventId} = state.activeEvent
    dispatch.반복일정상세조회(_originalCalendarId, recurringEventId)
  })
})

store.Calendar = reducer({}, (on) => {
  on.반복일정상세조회.SUCCESS(({calendarId, recurringEventId, recurrenceEvent}) => (state) => {
    state.Calendar[calendarId].recurringEvents[recurringEventId] = {
      ...state.Calendar[calendarId].recurringEvents[recurringEventId],
      recurrenceEvent,
    }
  })
})

// middleware? effect? whatever?
// 사이드 이펙트 격리
// 테스트도 쉽고, 추후 mock에도 용이하도록 만들 수 있다.
store.dispatch.반복일정상세조회 = async (calendarId, recurringEventId) => {
  const recurringEvent = await api.GET["/calendarEvent"](calendarId, recurringEventId)
  if (!recurringEvent?.recurrence) {
    throw Error("반복일정이 아님!")
  }

  recurrenceEvent.recurrenceFormat = getRecurrenceFormatFromRecurringEvent(recurringEvent)
  return {calendarId, recurringEventId, recurrenceEvent}
}

// 테스트용 mock을 만들수도 있다!
if (import.meta.vitest) {
  store.dispatch.반복일정상세조회 = async (calendarId, recurringEventId) => {
    const mock = {}
    return {calendarId, recurringEventId, recurrenceEvent: mock}
  }
}
