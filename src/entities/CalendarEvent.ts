import type {DateTime} from "src/libs/fp/date"
import type {Attendee} from "src/types/Attendee"
import {createStorePart} from "../test/newStore.ts"

type EventStatus = "confirmed" | "tentative" | "cancelled"
type GadgetDisplayMode = string
type ReminderMethod = string
type EventTransparency = "opaque" | "transparent"
type EventVisibility = "default" | "public" | "private" | "confidential"

export interface CalendarEvent {
  eventType?: string
  kind: "calendar#event"
  etag: string
  id: string
  calendarId: string
  status?: EventStatus
  htmlLink: string
  created: DateTime
  updated: DateTime
  summary: string
  description: string
  location: string
  colorId: string | null

  calendar: {
    id: string
    summary: string
    kakaoworkUserId: number
    primary: boolean
  }

  // The creator of the event. Read-only.
  creator: {
    id?: string
    email?: string
    displayName?: string
    self?: boolean
    kakaoworkUserId?: number
  }

  // The organizer of the event.
  organizer: {
    id?: string
    email?: string
    displayName?: string
    self?: boolean
    kakaoworkUserId?: number
  }

  start: {
    date?: string
    dateTime?: string
    timeZone?: string
  }

  end: {
    date?: string
    dateTime?: string
    timeZone?: string
  }

  endTimeUnspecified?: boolean

  recurrence: string[]

  // For an instance of a recurring event, this is the id of the recurring event to which this instance belongs. Immutable.
  recurringEventId?: string

  // Whether the organizer corresponds to the calendar on which this copy of the event appears. Read-only. The default is False.
  originalStartTime?: {
    date: string
    dateTime: string
    timeZone?: string
  }

  transparency?: EventTransparency
  visibility?: EventVisibility
  iCalUID: string
  sequence: number

  // The attendees of the event.
  attendees: Attendee[]

  attendeesOmitted?: boolean

  // Extended properties of the event.
  extendedProperties?: {
    private: {
      (key: string): string
    }
    shared: {
      (key: string): string
    }
  }

  // An absolute link to the Google+ hangout associated with this event. Read-only.
  hangoutLink?: string

  // A gadget that extends this event.
  gadget?: {
    type: string
    title: string
    link: string
    iconLink: string
    width?: number
    height?: number
    display?: GadgetDisplayMode
    preferences: {
      (key: string): string
    }
  }

  anyoneCanAddSelf?: boolean
  guestsCanInviteOthers?: boolean
  guestsCanModify?: boolean
  guestsCanSeeOtherGuests?: boolean
  privateCopy?: boolean

  // Whether this is a locked event copy where no changes can be made to the main event fields "summary", "description", "location", "start", "end" or "recurrence". The default is False. Read-Only.
  locked?: boolean

  reminders: {
    useDefault: boolean
    overrides?: {
      method: ReminderMethod
      minutes: number
    }[]
  }

  // Source from which the event was created. For example, a web page, an email message or any document identifiable by an URL with HTTP or HTTPS scheme.
  // Can only be seen or modified by the creator of the event.
  source?: {
    url: string
    title: string
  }

  // File attachments for the event. Currently only Google Drive attachments are supported.
  attachments?: {
    fileUrl: string
    title: string
    mimeType: string
    iconLink: string
    fileId: string
  }[]

  responseStatus: string
  backgroundColor: string
  primary: boolean
  conferenceData?: string
  deleted?: boolean
}

// custom ui
export interface CalendarEvent {
  type?: string
  collUuid?: string
}

// custom ui
export interface CalendarEvent {
  key: string

  start_dateTime: DateTime
  end_dateTime: DateTime
  hasLink: boolean

  _isNew?: boolean
  _originalCalendarId: string

  isAllDay: boolean
  allDayRange?: number

  recurrenceFormat?: string
  recurrence_option_index?: number

  isActive?: boolean
  isDragging?: boolean
  original_key?: string
  dragProxy?: boolean
  isGrayProxy?: boolean

  duration?: number
  allDay?: {
    index?: number
    start?: number
    end?: number
  }

  // @FIXME: view용 일정겹침
  _indent?: number

  일정변경_및_관리권한이_있는가: boolean
}

interface CalendarEventActions {
  빈시간선택(): void
}

interface Account {
  id: number
}

interface Repository {
  CalendarEvents: Record<PropertyKey, CalendarEvent>
  CalendarLists: Record<PropertyKey, CalendarEvent>
  account: Account
  activeEvent: CalendarEvent
}

const {store: CalendarEvent, reducer} = createStorePart<CalendarEvent, CalendarEventActions>()

const atom = reducer
const usecase = <T>(fn: (repo: Repository) => (state: CalendarEvent) => boolean): T => {}

CalendarEvent.dragProxy = atom((event) => event.id === "dragProxy")

CalendarEvent.isActive = usecase((repo) => (event) => event.id === repo.activeEvent.id)

CalendarEvent.일정변경_및_관리권한이_있는가 = usecase((repo) => (event) => {
  const {CalendarLists, account} = repo

  // 회의실 예약시스템 일정은 일정 변경 및 관리 권한이 없다.
  if (GRC_회의실_예약시스템_일정인가(event)) {
    return false
  }

  const accessRole = CalendarLists[event.calendarId].accessRole

  // "owner"거나 "delegator"면 수정 가능
  if (accessRole === "owner" || accessRole === "delegator") {
    return true
  }

  // "writer"이면서 새 일정은 OK
  if (accessRole === "writer" && !event._isNew) {
    return true
  }

  // "writer"이면서 내가 생성한 일정은 수정 가능
  if (accessRole === "writer" && event.id) {
    const 현재_캘린더_ID = event.calendarId
    const 원본_캘린더_ID = event.calendar.id
    const creatorId = event.creator.kakaoworkUserId

    if (현재_캘린더_ID === 원본_캘린더_ID && creatorId === account?.id) {
      return true
    }
  }

  return false
})

start = DateTime.from(start).startOf("day").add({days: +NUM_WEEK_OFFSET})
end = start.add({days: +NUM_WEEK})

CalendarEvent.allDay = {index: 0}
CalendarEvent.allDay.start = atom((event) => Math.ceil((+event.start_dateTime - +start) / 1000 / 60 / 60 / 24))
CalendarEvent.allDay.end = atom((event) => Math.ceil((+event.end_dateTime - +start) / 1000 / 60 / 60 / 24))
