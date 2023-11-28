# 🚧 ReactForge

> 📌 아직 완성되지 않았습니다. 만들어 보고 있는 중입니다!

**ReactForge**는 All-in-One 프론트엔드 개발툴을 지향합니다.

```ts
// @TODO
// 라이브러리 구현 코드는 test 폴더를 참고해주세요!!
```

### 주요 개념

- Store
- State
- Draft

- Action
- Dispatch
- On
- Reducer

### 주요 특징
- 중앙 집권형 개발방식
- All-in-one
- Proxy 기반

- 타입 안전성 강화: TypeScript를 활용하여 상태 관리 시스템의 안정성과 정확성을 보장합니다.
- 자동 타입 추론: 복잡한 타입 정의 없이 최대한 자동 추론을 활용하여 개발자의 부담을 줄입니다.
- 간결하고 명확한 API: Redux의 기본 원칙을 유지하면서, 사용하기 쉬운 API를 제공합니다.
- 코드 일관성 및 표준화: 프로젝트 내에서 일관된 코드 스타일과 구조를 촉진합니다.

> - 진짜 쉽고 협업을 위한 상태관리를 만들어보자.
> - 그동안은 너무 자유와 방종을 추구했다.
> - 강력한 제한, 이렇게 밖에 쓸 수 없는 구조, 방식!
> - 디버깅, 자동완성, 타입체킹 우선
> - 그럼에도 외부 모듈 의존도 X

- React를 보니 Pull 방식도 나쁜게 아니더라.
- Proxy 기반의 업데이트
- 접근하고 있는 값만 체크하고 이후 업데이트는 해당 값만 추려내서 업데이트 하는 방식으로 re-render 방지



## 특징

### 강력한 타입 시스템과 자동완성
- StateForge는 TypeScript의 강력한 타입 시스템을 기반으로 구축되었습니다. 이는 개발 중에 높은 수준의 자동완성 지원을 제공하며, 타입 관련 오류를 사전에 방지할 수 있게 해줍니다. 개발자가 코드를 작성할 때 필요한 속성이나 액션을 쉽게 찾을 수 있도록 도와줍니다.

### 최소한의 보일러플레이트
- Redux와 같은 기존의 상태 관리 라이브러리들은 많은 설정과 보일러플레이트 코드가 필요합니다. StateForge는 이런 부분을 대폭 간소화하여 개발자가 비즈니스 로직에 더 집중할 수 있도록 설계되었습니다. 필요한 기능을 몇 줄의 코드로 간결하게 표현할 수 있습니다.

### 사전 구성된 필수 요소들
- StateForge는 애플리케이션을 빠르게 시작할 수 있도록 사전에 필요한 많은 구성 요소들을 제공합니다. 이를 통해 개발자는 반복적인 설정 작업 없이 바로 상태 관리 로직의 구현에 착수할 수 있습니다.

## 차별화 요소

### Redux Toolkit 영감
- StateForge는 Redux Toolkit의 영감을 받아 더 나은 개발 경험을 제공합니다. 하지만 StateForge는 타입 안전성과 자동완성을 개선하여 Redux Toolkit이 제공하는 것 이상의 개발자 경험을 제공합니다.

### 직관적인 API
- StateForge의 API는 직관적이며 사용하기 쉽습니다. 슬라이스 생성, 액션 정의, 스토어 구성 등의 과정이 단순화되어 있어, 새로운 개발자도 쉽게 상태 관리 시스템을 이해하고 사용할 수 있습니다.

---

### State & Action

- Interface를 먼저 설계하고 개발하는 방식
- State와 Action을 분리해서 개발하기 쉽게! BDD, SDD
- 쓸데없은 ActionType, ActionCreator 이런거 NoNo!
- Proxy 기반으로 쓸데없이 불변성을 지키기 위한 코딩 하지 않는다.
- 

```ts
export interface Todo {
  id:number
  text:string
  completed:boolean
}

export type VisibilityFilter = "SHOW_ALL"|"SHOW_COMPLETED"|"SHOW_ACTIVE"

export interface TodoState {
  Query: {
    todos:Todo[]
    filteredTodos:Todo[]
  }
  Todo: Record<string, Todo>
  
  visibilityFilter:VisibilityFilter
}

export interface TodoActions {
  ADD_TODO(text:string):void
  TOGGLE_TODO(id:number):void
  REMOVE_TODO(id:number):void

  SET_VISIBILITY_FILTER(filter:VisibilityFilter):void
}
```

```ts
import {store, reducer} from "./store"

store.Todo = reducer([], on => {
  on.ADD_TODO(state => (text) => {
    const newTodo = {id: Date.now(), text, completed: false}
    state.Todo[id] = newTodo
  })

  on.TOGGLE_TODO(state => (id) => {
    state.Todo[id].completed = !state.Todo[id].completed
  })

  on.REMOVE_TODO(state => (id) => {
    delete state.Todo[id]
  })
})

store.Query.todos = reducer(state => Object.values(state.Todo))

store.Query.filteredTodos = reducer(state => {
  const todos = state.Query.todos
  const visibilityFilter = state.visibilityFilter

  if (visibilityFilter === "SHOW_ACTIVE") {
    return todos.filter(todo => !todo.completed)
  }

  if (visibilityFilter === "SHOW_COMPLETED") {
    return todos.filter(todo => todo.completed)
  }

  return todos
})

store.visibilityFilter = reducer("SHOW_ALL", on => {
  on.SET_VISIBILITY_FILTER(state => filter => state.visibilityFilter = filter)
})
```




### Create API

목표

- fetchXXX, getXXX, 보일러 플레이트 없애기
- d.ts 파일에다가 interface로 등록하면 번들에 포함이 되지 않는다.
- proxy와 typescript를 통해 자동완성 받을 수 있다.
- 이 형식을 스웨거를 통해서 자동생성 할 수 있다


```ts
type Response<State> = createResponse<{
  status:number,
  data:State
}>

interface API_Post {
  GET:{
    ["/posts/recommend"]():Response<{lastKey:string, list:Post[]}>
    ["/posts/:postId"](postId:string):Response<Post>
    ["/posts/:postId/comments"](postId:string, params?:unknown):Response<Comment[]>
  }
}

interface API_Calendar {
  GET:{
    ["/calendars"]():Response<Calendar[]>
    ["/calendars/:calendarId"](calendarId:string):Response<Calendar>
  }

  POST:{
    ["/calendars/:calendarId"](calendarId:string, body:Calendar, q:{lastKey:string}):Response<Calendar>
  }

  PUT:{
    ["/calendars/:calendarId"]():Response<Calendar>
  }
}

type API
  = API_Post
  & API_Calendar

export const api = createAPI<API>({
  baseURL: "https://example.com/api",
  fetchOptions: {
    /* @TODO: 여기 헤더와 보안 작업 추가 되어야 함.*/
  }
})
```

### API 사용방법

```ts
// GET /posts/recommend
const res = await api.GET["/posts/recommend"]()
console.log(res.data.data.list)

// GET /posts/7yKG9ccNK82?lastKey=100
const res2 = await api.GET["/posts/:postId"]("7yKG9ccNK82", {lastKey:100})
console.log(res2)

// POST /calendars/7yKG9ccNK82?lastKey=100 body:{x:100}
const res3 = await api.POST["/calendars/:calendarId"]("7yKG9ccNK82", {x:100}, {lastKey:100})
```

