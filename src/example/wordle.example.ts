import {createStore} from "../test/createStore.ts"

interface Actions {
  PUSH_LETTER(key: string): void
  BACKSPACE(): void
  ENTER(): void

  NOT_IN_WORD_LIST(): void
  NOT_IN_WORD_LIST_ANIMATE_END(): void

  MATCH_WORD(inputWord: string): void
  START_MATCH_ANIMATE(): void

  NEXT_STEP(): void
  GAME_END(): void

  SHOW_TOAST(msg: string, duration?: number): void
}

type KeyType = "pop" | "absent" | "correct" | "present"

interface Key {
  char: string
  type: KeyType
  animation: "flip-in" | "flip-out"
}

type Computed<T> = T

interface States {
  currentState: "IDLE" | "ANIMATING" | "END"

  answer: string

  allLetters: Array<Array<Key>>
  allLetters_animate: Array<"none" | "shake">
  currentLineIndex: number

  currentLine: Computed<Array<Key>>
  matchedLetters: Record<string, KeyType>

  toast: string
}

const {store, reducer, dispatch} = createStore<States, Actions>()

const KEY1 = "qwertyuiop".split("")
const KEY2 = "asdfghjkl".split("")
const KEY3 = "zxcvbnm".split("")

const NUM_MAX_WORD_COUNT = 5
const NUM_TRY_COUNT = 6

const WORDS = ["world"]

store.currentState = reducer("IDLE", (on) => {
  on.MATCH_WORD(() => (state) => {
    state.currentState = "ANIMATING"
  })

  on.NEXT_STEP(() => (state) => {
    state.currentState = "IDLE"
  })

  on.GAME_END(() => (state) => {
    state.currentState = "END"
  })
})

// const answer = WORDS[Math.floor(Math.random() * WORDS.length)]
store.answer = "world"

store.currentLineIndex = reducer(0, (on) => {
  on.NEXT_STEP(() => (state) => {
    state.currentLineIndex++
  })
})

store.allLetters = reducer(
  Array(NUM_TRY_COUNT)
    .fill("")
    .map(() => [])
)

store.currentLine = reducer(
  (state) => state.allLetters[state.currentLineIndex],
  (on) => {
    const matchWordle = (s_answer: string, s_guess: string) => {
      const answer = s_answer.split("")
      const guess = s_guess.split("")

      const result = guess.map((char) => ({char, type: "absent"}))

      // correct
      guess.forEach((char, i) => {
        if (char === answer[i]) {
          result[i] = {char, type: "correct"}
          answer[i] = ""
        }
      })

      // present
      guess.forEach((char, i) => {
        if (result[i].type === "correct") return
        if (answer.includes(char)) {
          result[i] = {char, type: "present"}
          answer[answer.indexOf(char)] = ""
        }
      })

      return result
    }

    on.PUSH_LETTER((char) => (state) => {
      if (state.currentLine.length >= NUM_MAX_WORD_COUNT) {
        return
      }

      state.currentLine.push({char, type: "pop", animation: ""})
    })

    on.BACKSPACE(() => (state) => {
      state.currentLine.pop()
    })

    on.ENTER(() => (state) => {
      if (state.currentLine.length < NUM_MAX_WORD_COUNT) {
        return
      }

      const inputWord = state.currentLine.map((key) => key.char).join("")

      // check Not in word list
      if (!WORDS.includes(inputWord)) {
        dispatch.NOT_IN_WORD_LIST()
        return
      }

      dispatch.MATCH_WORD(inputWord)
    })

    on.MATCH_WORD((inputWord) => (state) => {
      // match Animation
      // @TODO: animation with 비동기... 비동기를 어떻게 할까?
      const matched = matchWordle(inputWord, state.answer)

      // filp-in, flip-out animation 적용
      matched.forEach(({char, type}, i) => {
        setTimeout(async () => {
          state.currentLine[i] = {char, type: "pop", animation: "flip-in"}
          setTimeout(() => (state.currentLine[i] = {char, type, animation: "flip-out"}), 250)
        }, 250 * i)
      })

      setTimeout(
        () => {
          // 매칭된 글자를 저장한다.
          state.currentLine.forEach(({char, type}) => {
            if (state.matchedLetters[char] === "correct") {
              return
            }
            state.matchedLetters[char] = type
          })

          // 다음 단계로 이동
          if (currentStep >= NUM_MAX_WORD_COUNT) {
            dispatch.GAME_END()
            return
          }

          dispatch.NEXT_STEP()
        },
        250 * matched.length + 250
      )
    })
  }
)

store.allLetters_animate = reducer(Array(NUM_TRY_COUNT).fill("none"), (on) => {
  on.NOT_IN_WORD_LIST(() => (state) => {
    state.allLetters_animate[state.currentLineIndex] = "shake"
  })

  on.NOT_IN_WORD_LIST_ANIMATE_END(() => (state) => {
    state.allLetters_animate[state.currentLineIndex] = "none"
  })
})

// 토스트 팝업
store.toast = reducer("", (on) => {
  const TOAST_DURATION = 1500
  const TOAST_DURATION_LONG = 5000

  const delay = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration))

  on.SHOW_TOAST((msg, duration = TOAST_DURATION) => async (state) => {
    state.toast = msg
    await delay(duration)
    state.toast = ""
  })

  on.NOT_IN_WORD_LIST(() => () => {
    dispatch.SHOW_TOAST("Not In word list")
  })

  on.GAME_END(() => (state) => {
    dispatch.SHOW_TOAST("정답은 " + state.answer + " 입니다.", TOAST_DURATION_LONG)
  })
})
