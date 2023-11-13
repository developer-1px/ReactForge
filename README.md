# 🚧 StateForge

> 📌 아직 완성되지 않았습니다. 만들어 보고 있는 중입니다!

**StateForge**는 TypeScript 기반의 상태 관리 라이브러리로, Redux의 핵심 개념을 유지하면서 타입 안전성과 개발자 경험을 최적화하기 위해 설계되었습니다. 이 라이브러리는 상태 관리를 간소화하고, 타입 추론을 활용하여 개발자가 직면할 수 있는 복잡성을 최소화합니다. 목표는 코드의 일관성을 높이고, 팀 내 표준화를 촉진하는 것입니다.

### 주요 특징
- 타입 안전성 강화: TypeScript를 활용하여 상태 관리 시스템의 안정성과 정확성을 보장합니다.
- 자동 타입 추론: 복잡한 타입 정의 없이 최대한 자동 추론을 활용하여 개발자의 부담을 줄입니다.
- 간결하고 명확한 API: Redux의 기본 원칙을 유지하면서, 사용하기 쉬운 API를 제공합니다.
- 코드 일관성 및 표준화: 프로젝트 내에서 일관된 코드 스타일과 구조를 촉진합니다.

> - 진짜 쉽고 협업을 위한 상태관리를 만들어보자.
> - 그동안은 너무 자유와 방종을 추구했다.
> - 강력한 제한, 이렇게 밖에 쓸 수 없는 구조, 방식!
> - 디버깅, 자동완성, 타입체킹 우선
> - 그럼에도 외부 모듈 의존도 X

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

```ts
export interface Todo {
  id:number
  text:string
  completed:boolean
}

export type VisibilityFilter = "SHOW_ALL"|"SHOW_COMPLETED"|"SHOW_ACTIVE"

interface Query {
  filteredTodos:Array<Todo>
}

export interface TodoState {
  todos:Array<Todo>
  items:Collection<Todo>
  visibilityFilter:VisibilityFilter
  Query: Query
}

export interface TodoActions {
  ADD_TODO(text:string):void
  TOGGLE_TODO(id:number):void
  REMOVE_TODO(id:number):void

  SET_VISIBILITY_FILTER(filter:VisibilityFilter):void
}
```

```ts
import {createStateForge} from "stateForge"

export const {
  createSlice,
  createEffect,
  createStore
} = createStateForge<TodoState, TodoActions>("store")
```


### Slice
- 데이터를 기반으로 모듈화
- State와 Action의 자동완성
- 외부 라이브러리가 필요없게 내장

```ts
import {createSlice} from "./index"

export const todos = createSlice(store => store.todos, [], helpers => {

  const {on, value, set, insert, remove, toggle} = helpers
  
  on.ADD_TODO((text) => {
    const newTodo = {id: Date.now(), text, completed: false}
    insert(newTodo)
  })

  on.TOGGLE_TODO((id) => {
    toggle(todo => todo.id === id, "completed")
  })

  on.REMOVE_TODO((id) => {
    remove(todo => todo.id === id)
  })
})

export const visibilityFilter = createSlice(store => store.visibilityFilter, "SHOW_ALL", ({on, set}) => {
  on.SET_VISIBILITY_FILTER(set)
})
```



### Store

- 강력한 중앙집권
- 찾아가기 쉽게 네비게이션의 역할, 추후 디버깅 용이
- strict 타입체킹, 빠진 slice가 있으면 타입에러

```ts
import {todos} from "./todos"
import {createStore} from "./index"
import {items, visibilityFilter} from "./etc.ts"

export const store = createStore({
  todos,
  items,
  visibilityFilter,
  section: {
    filteredTodos: []
  }
})
```


### Create API

```ts
type Response<T> = createResponse<{
  status:number,
  data:T
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
  baseURL: "https://uc-api.ep.oror.io/api",
  fetchOptions: {}
})
```

### API 사용방법

```ts
const res = await api.GET["/posts/recommend"]()
console.log(res.data.data.list)

// pahh, queryString
const res2 = await api.GET["/posts/:postId"]("7yKG9ccNK82", {lastKey:100})
console.log(res2)

// path, body, queryString
const res3 = await api.POST["/calendars/:calendarId"]("!23123", {x:100}, {lastKey:100})
```

## 생각해보기.. 메모.. 인사이트..

---

```ts
on.ADD_TODO((text) => {

    // @TODO: anti-pattern
    // 1. 외부 값을 가져오지 못하게 하기
    const account = state.account
    const todo = {id:guid(), title:text, userId: account.id} 
```


```ts
// 리덕스는 리듀서를 순수하게 만들어야 한다!

createSlice(... => {
// 1. 외부 값이 필요하면 payload에 넣어라.
  on.ADD_TODO((text, account) => {
    const todo = {id: guid(), title: text, userId: account.id}
    //..
  })
})


// 리덕스는 이렇게 하던데.. 검토해보기...
const accountMiddleware = createMiddleware( ... => {
  // 2. account를 매번 넣어주는게 부담스럽다면 미들웨어를 사용하라!
  on.ADD_TODO(text, (dispatch) => {
    const account = state.account
    dispatch.ADD_TODO(text, account)
  })
})

```

