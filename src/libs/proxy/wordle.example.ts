import {createStore} from "./lib.ts"

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

interface Key {
  char: string
  type: "pop" | "absent" | "correct" | "present"
  animation: "flip-in" | "flip-out"
}

type Computed<T> = T

interface States {
  currentState: "IDLE" | "ANIMATING" | "END"

  answer: string

  allLetters: Array<Array<Key>>
  allLetters_animate: Array<"none" | "shake">
  numCurrentLine: number

  currentLine: Computed<Array<Key>>

  toast: string
}

const {store, reducer, dispatch} = createStore<Actions, States>()

const KEY1 = "qwertyuiop".split("")
const KEY2 = "asdfghjkl".split("")
const KEY3 = "zxcvbnm".split("")

const NUM_MAX_WORD_COUNT = 5
const NUM_TRY_COUNT = 6

const WORDS = ["world"]

store.currentState = reducer("IDLE", (on) => {
  on.MATCH_WORD((state) => () => {
    state.currentState = "ANIMATING"
  })

  on.NEXT_STEP((state) => () => {
    state.currentState = "IDLE"
  })

  on.GAME_END((state) => () => {
    state.currentState = "END"
  })
})

// const answer = WORDS[Math.floor(Math.random() * WORDS.length)]
store.answer = "world"

store.numCurrentLine = reducer(0, (on) => {
  on.NEXT_STEP((state) => () => {
    state.numCurrentLine++
  })
})

store.allLetters = reducer(
  Array(NUM_TRY_COUNT)
    .fill("")
    .map(() => [])
)

store.currentLine = reducer(
  (state) => state.allLetters[state.numCurrentLine],
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

    on.PUSH_LETTER((state) => (char: string) => {
      if (state.currentLine.length >= NUM_MAX_WORD_COUNT) {
        return
      }

      state.currentLine.push({char, type: "pop", animation: ""})
    })

    on.BACKSPACE((state) => () => {
      state.currentLine.pop()
    })

    on.ENTER((state) => () => {
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

    on.MATCH_WORD((state) => (inputWord) => {
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
            if (matchedLetters[char] === "correct") {
              return
            }
            matchedLetters[char] = type
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
  on.NOT_IN_WORD_LIST((state) => () => {
    state.allLetters_animate[state.numCurrentLine] = "shake"
  })

  on.NOT_IN_WORD_LIST_ANIMATE_END((state) => () => {
    state.allLetters_animate[state.numCurrentLine] = "none"
  })
})

store.toast = reducer("", (on) => {
  // 토스트 팝업
  const TOAST_DURATION = 1500
  const TOAST_DURATION_LONG = 5000

  const delay = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration))
  const effect = on

  on.SHOW_TOAST((state) => async (msg, duration = TOAST_DURATION) => {
    state.toast = msg
    await delay(duration)
    state.toast = ""
  })

  on.NOT_IN_WORD_LIST((_) => () => {
    dispatch.SHOW_TOAST("Not In word list")
  })

  on.GAME_END((_) => () => {
    dispatch.SHOW_TOAST("정답은 " + answer + " 입니다.", TOAST_DURATION_LONG)
  })
})

// <div class="vbox h(100%)">
//
// <Header/>
//
// <!-- Words -->
// <div class="flex w(320~500) m(auto) pack uppercase">
// <div class="vbox gap(5)">
//   {#each allLetters as row, step}
//   <div class="hbox gap(5) {allLetters_animate[step]}" on:animationend={() => allLetters_animate[step]=''}>
// {#each Array(5) as _, index}
// <div class="b(2/--color-tone-4) w(62) h(62) pack font(30) bold
//   .absent:bg(--color-absent) .absent:c(#fff) .absent:b(none)
//   .correct:bg(--color-correct) .correct:c(#fff) .correct:b(none)
//   .present:bg(--color-present) .present:c(#fff) .present:b(none)
// {row[index]?.animation} .pop:b(2/--color-tone-2)
// {row[index]?.type}">{row[index]?.char ?? ''}</div>
// {/each}
// </div>
//   {/each}
//   </div>
//   </div>
//
//   <!-- Keyboard -->
//   <div class="w(100%) w(320~500) m(auto) grid grid-template-columns(repeat(20,1fr)) p(8) gap(6) uppercase">
//     {#each KEY1 as key}
//     <KeyButton class="grid-column(span/2)" on:click={() => pushLetter(key)} type={matchedLetters[key]}>{key}</KeyButton>
//     {/each}
//
//     <div class="grid-column(span/1)"/>
//       {#each KEY2 as key}
//       <KeyButton class="grid-column(span/2)" on:click={() => pushLetter(key)} type={matchedLetters[key]}>{key}</KeyButton>
//       {/each}
//       <div class="grid-column(span/1)"/>
//
//       <KeyButton class="grid-column(span/3)" tabindex="-1">ENTER</KeyButton>
//         {#each KEY3 as key}
//         <KeyButton class="grid-column(span/2)" on:click={() => pushLetter(key)} type={matchedLetters[key]}>{key}</KeyButton>
//         {/each}
//         <KeyButton class="grid-column(span/3)" tabindex="-1" on:click={backspace}>
//         <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
//         <path fill="var(--color-tone-1)" d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.66-7H22v14zm-11.59-2L14 13.41 17.59 17 19 15.59 15.41 12 19 8.41 17.59 7 14 10.59 10.41 7 9 8.41 12.59 12 9 15.59z"></path>
//           </svg>
//           </KeyButton>
//           </div>
//
//           {#if toast}
//           <div transition:fade={250} class="bg(#000) r(8) c(#fff) bold p(8/12) absolute top(10%) left(50%) translateX(-50%)">{toast}</div>
//           {/if}
//           </div>
//
//           <svelte:head>
//           <title>테오의 프론트엔드 - Wordle Challenge</title>
//           </svelte:head>
//
//           <svelte:window on:keydown={onkeydown}/>
//
