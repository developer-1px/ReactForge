import {useEffect} from "react"
import {createComponentStore, createStore} from "../test/newStore.ts"
import {delay, map, of} from "rxjs"

interface Char {
  type: "idle" | "correct" | "present" | "absent"
  char: string
  animation: "" | "flip-in" | "flip-out"
}

interface Line {
  chars: Char[]
  index: number
}

interface LineActions {
  PUSH_KEY(key: string): void
  BACKSPACE(): void

  SHOW_NOT_IN_WORD_LIST_ANIMATION(): void
  NOT_IN_WORD_LIST_ANIMATE_END(): void
  SHOW_MATCHED_ANIMATION(matched: Char[]): void
}

const [useLine, LineProvider, LineRepo] = createComponentStore<Line, LineActions>(({store, reducer, dispatch, middleware}) => {
  const update = reducer

  const createChar = (char: string) => ({type: "idle", char, animation: ""}) as Char

  // 이게 제일 좋을까? 의존성...
  store.index = 0
  store.chars = ["", "", "", "", ""].map(createChar)

  store.update = update(null, (on) => {
    on.PUSH_KEY((key) => (state) => {
      if (state.index >= 5) return
      state.chars[state.index].char = key
      state.index++
    })

    on.BACKSPACE(() => (state) => {
      if (state.index <= 0) return
      state.chars[state.index - 1].char = ""
      state.index--
    })
  })

  store.effect = update(null, (on) => {
    on.SHOW_MATCHED_ANIMATION((matched) => async (state) => {
      // filp-in, flip-out animation 적용
      matched.forEach(({char, type}, i) => {
        state.chars[i] = delay(250 * i, {char, type: "pop", animation: "flip-in"})
        state.chars[i] = queue({char, type: type, animation: "flip-out"})
      })
      await Promise.all(state.chars)
    })
  })
}, "Line")

interface AppState {
  Line: typeof LineRepo

  answer: string
  currentLineIndex: number
  matchedLetters: Record<string, Char["type"]>

  readonly currentLine: (typeof LineRepo)[keyof typeof LineRepo]
  readonly inputWord: string
  readonly canEnter: boolean

  toast: string
}

interface AppActions {
  PUSH_KEY(key: string): void
  BACKSPACE(): void
  ENTER(): void

  NOT_IN_WORD_LIST(): void

  SHOW_MATCHED_ANIMATION(matched: Char[]): void
  SAVE_MATCHED_LETTER(matched: Char[]): void

  NEXT_STEP(): void
  GAME_END(): void

  // effect
  MATCH_WORD(inputWord: string, answer: string, currentLineIndex: number): void

  //
  SHOW_TOAST(msg: string, duration?: number): void
}

const useStore = createStore<AppState, AppActions>(({store, reducer}) => {
  const WORDS = ["DRIVE", "XXXXX"]
  const NUM_MAX_WORD_COUNT = 6

  const selector = reducer
  const update = reducer

  store.answer = "REACT"

  store.Line = LineRepo

  store.currentLineIndex = reducer(0, (on) => {
    on.NEXT_STEP(() => (state) => state.currentLineIndex++)
  })

  store.currentLine = selector((state) => state.Line.of(state.currentLineIndex))

  store.matchedLetters = reducer({}, (on) => {
    on.SAVE_MATCHED_LETTER(() => (state) => {
      state.currentLine.chars.forEach(({char, type}) => {
        if (state.matchedLetters[char] !== "correct") {
          state.matchedLetters[char] = type
        }
      })
    })
  })

  store.inputWord = selector((state) => state.currentLine.chars.join(""))

  store.canEnter = selector((state) => state.inputWord.length === 5)

  // 토스트 팝업
  store.toast = reducer("", (on) => {
    const TOAST_DURATION = 1500
    const TOAST_DURATION_LONG = 5000

    on.SHOW_TOAST((msg, duration = TOAST_DURATION) => (state) => {
      return of(msg).pipe(
        delay(duration),
        map(() => "")
      )
    })
  })

  //
  const isNotInWordList = (inputWord: string) => !WORDS.includes(inputWord)

  const matchWordle = (input: string, answer: string) => {
    return [] as Char[]
  }

  store.update = update(null, (on) => {
    on.PUSH_KEY((key) => (state) => {
      state.currentLine.dispatch.PUSH_KEY(key)
    })

    on.BACKSPACE(() => (state) => {
      state.currentLine.dispatch.BACKSPACE()
    })

    on.ENTER(() => (state, effect) => {
      if (!state.canEnter) {
        return
      }

      effect.MATCH_WORD(state.inputWord, state.answer)
    })

    on.MATCH_WORD((inputWord: string, answer: string, currentLineIndex: number) => async (_, dispatch) => {
      // Word가 아닌 경우,
      if (isNotInWordList(inputWord)) {
        dispatch.NOT_IN_WORD_LIST()
        return
      }

      // match Animation
      const matched = matchWordle(inputWord, answer)

      let somthing = await animation()
      dispatch.SHOW_MATCHED_ANIMATION(matched)

      // 매칭된 글자를 저장한다.
      dispatch.SAVE_MATCHED_LETTER(matched)

      // 도전 기회가 남았다면? -> 다음 기회
      if (currentLineIndex < NUM_MAX_WORD_COUNT) {
        dispatch.NEXT_STEP()
        return
      }

      // 게임 끝
      dispatch.GAME_END()
    })

    //
    on.NOT_IN_WORD_LIST(() => (state) => {
      state.currentLine.dispatch.SHOW_NOT_IN_WORD_LIST_ANIMATION()
    })

    on.SHOW_MATCHED_ANIMATION((matched) => (state) => {
      state.currentLine.dispatch.SHOW_MATCHED_ANIMATION(matched)
    })

    //
    on.NOT_IN_WORD_LIST(() => (state, dispatch) => {
      dispatch.SHOW_TOAST("Not In word list")
    })

    on.GAME_END(() => (state, dispatch) => {
      dispatch.SHOW_TOAST("정답은 " + state.answer + " 입니다.", TOAST_DURATION_LONG)
    })
  })
})

const useEvent = (
  target: EventTarget,
  type: string,
  callback: EventListenerOrEventListenerObject | null,
  options?: AddEventListenerOptions | boolean
) => {
  useEffect(() => {
    target.addEventListener(type, callback, options)
    return () => target.removeEventListener(type, callback)
  })
}

function WordleLine() {
  const {chars} = useLine()

  return (
    <>
      <div className="hbox gap(10)">
        {chars.map((char, index) => (
          <div className="w(20) h(20) b(#000) pack" key={index}>
            {char}
          </div>
        ))}
      </div>
    </>
  )
}

export default function Wordle() {
  const lines = Array(5).fill("")

  const {dispatch} = useStore()

  useEvent(window, "keydown", (e) => {
    if (/^[a-zA-Z]$/.test(e.key)) {
      dispatch.PUSH_KEY(e.key.toUpperCase())
    } else if (e.key === "Backspace") {
      dispatch.BACKSPACE()
    } else if (e.key === "Enter") {
      dispatch.ENTER()
    }
  })

  return (
    <>
      <div>
        {lines.map((line, index) => (
          <LineProvider key={index} id={index}>
            <WordleLine />
          </LineProvider>
        ))}
      </div>
    </>
  )
}
