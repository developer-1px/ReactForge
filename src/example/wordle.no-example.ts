const KEY1 = "qwertyuiop".split("")
const KEY2 = "asdfghjkl".split("")
const KEY3 = "zxcvbnm".split("")

const NUM_MAX_WORD_COUNT = 5
const NUM_TRY_COUNT = 6

const WORDS = ["world"]

enum State {
  IDLE,
  IS_ANIMATING,
  GAME_END,
}

let currentState:State = State.IDLE

const answer = "world"
// const answer = WORDS[Math.floor(Math.random() * WORDS.length)]

const allLetters = Array(NUM_TRY_COUNT).fill(null).map(() => [])
const allLetters_animate = Array(NUM_TRY_COUNT).fill("")
const matchedLetters = Object.create(null)

let currentStep = 0

///
const getCurrentLetters = () => allLetters[currentStep]

const matchWordle = (s_answer:string, s_guess:string) => {
  const answer = s_answer.split("")
  const guess = s_guess.split("")

  const result = guess.map(char => ({char, type: "absent"}))

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

// 토스트 팝업
const TOAST_DURATION = 1500
const TOAST_DURATION_LONG = 5000

let toast = ""
let timer:ReturnType<typeof setTimeout>

const showToast = (text:string, duration = TOAST_DURATION) => {
  toast = text
  clearTimeout(timer)
  timer = setTimeout(() => {
    toast = ""
  }, duration)
}

// 글자 입력
const pushLetter = (char:string) => {
  if (currentState !== State.IDLE) return

  const letters = getCurrentLetters()
  if (letters.length >= NUM_MAX_WORD_COUNT) {
    return
  }

  allLetters[currentStep] = [...letters, {char, type: "", animation: "pop"}]
}

// 백스페이스: 글자삭제
const backspace = () => {
  if (currentState !== State.IDLE) return

  const letters = getCurrentLetters()
  allLetters[currentStep] = letters.slice(0, -1)
}

// 엔터
const enter = () => {
  if (currentState !== State.IDLE) return

  const letters = getCurrentLetters()
  if (letters.length < NUM_MAX_WORD_COUNT) {
    return
  }

  const input = letters.map(({char}) => char).join("")

  // check Not in word list
  if (!WORDS.includes(input)) {
    showToast("Not In word list")
    allLetters_animate[currentStep] = "shake"
    return
  }

  // 입력된 글자를 통해 단어를 찾는다.
  const matched = matchWordle(answer, input)

  // filp-in, flip-out animation 적용
  currentState = State.IS_ANIMATING
  matched.forEach(({char, type}, i) => {
    const step = currentStep
    setTimeout(async () => {
      allLetters[step][i] = {char, type: "pop", animation: "flip-in"}
      await tick()
      setTimeout(() => allLetters[step][i] = {char, type, animation: "flip-out"}, 250)
    }, 250 * i)
  })

  setTimeout(() => {
    // 매칭된 글자를 저장한다.
    allLetters[currentStep].forEach(({char, type}) => {
      if (matchedLetters[char] === "correct") {
        return
      }
      matchedLetters[char] = type
    })

    // 다음 단계로 이동
    if (currentStep >= NUM_MAX_WORD_COUNT) {
      setTimeout(() => end())
    }

    currentStep++
    currentState = State.IDLE

  }, 250 * matched.length + 250)
}

const end = () => {
  currentState = State.GAME_END
  showToast("정답은 " + answer + " 입니다.", TOAST_DURATION_LONG)
}


// 키를 누르면 키입력 전달
const onkeydown = (event) => {
  if (currentState !== State.IDLE) return

  if (event.metaKey || event.ctrlKey || event.altKey) {
    return
  }

  if (event.key.length === 1 && event.key.match(/[a-z]/i)) {
    pushLetter(event.key)
  }
  else if (event.key === "Backspace") {
    backspace()
  }
  else if (event.key === "Enter") {
    enter()
  }
}



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
>