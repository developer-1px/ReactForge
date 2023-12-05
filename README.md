# 🚧 ReactForge

> 📌 아직 완성되지 않았습니다. 만들어 보고 있는 중입니다!

**ReactForge**는 All-in-One 프론트엔드 개발툴을 지향합니다.

## Basic Example

```ts
// State
interface State {
  count:number
  doubledCount:number
}

// Action
interface Actions {
  INCREASE(by:number):void
  DECREASE(by:number):void
  RESET():void
}
```

```ts
// Store.md
export const useStore = createStore<State, Actions>(({store, reducer}) => {

  // Reducer
  store.count = reducer(0, (on) => {
    on.INCREASE((by) => (state) => (state.count += by))
    on.DECREASE((by) => (state) => (state.count -= by))
    on.RESET(() => (state) => (state.count = 0))
  })

  // Computed
  store.doubledCount = reducer((state) => state.count * 2)
})
```

You can use store in React.

```tsx
// Component
function Counter() {
  const {dispatch, count, doubledCount} = useStore()

  const 증가 = () => dispatch.INCREASE(1)

  const 감소 = () => dispatch.DECREASE(1)

  const 초기화 = () => dispatch.RESET()

  return (
    <>
      <div>count is {count}</div>
      <div>doubledCount is {doubledCount}</div>
      <button onClick={증가}>+</button>
      <button onClick={감소}>-</button>
      <button onClick={초기화}>RESET</button>
    </>
  )
}
```


### Core Concept

- 정답이 있는 프레임워크가 되자.
- 강력한 제한을 걸면 코드는 클린해질 수 있다. 
- 프레임워크를 쓰는 것 자체가 컨벤션이 될 수 있도록 하자.
- 누가 작성을 해도 클린코드가 될 수 있도록 넛지를 발휘
- 그렇지만 Draft한 개발 과정에서 빠르게 개발을 할 수 있도록 선 개발 후 리팩토링도 가능하게
- 빠른 개발보다 추적과 디버깅을 더 중요하게 생각한다.
- 그렇다고 프레임워크를 사용하는 것이 허들이 되어서는 안된다.


### 원칙

- 확실한 CQRS
- 함수형 프로그래밍의 컨셉(불변성, 단방향)
- state는 Action을 통해서만 수정을 할 수 있다.


## More Real World App

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
export const useStore = createStore<TodoState, TodoActions>(({store, reducer}) => {

  store.Todo = reducer([], on => {
    on.ADD_TODO((text) => (state) => {
      const newTodo = {id: Date.now(), text, completed: false}
      state.Todo[id] = newTodo
    })

    on.TOGGLE_TODO((id) => (state) => {
      state.Todo[id].completed = !state.Todo[id].completed
    })

    on.REMOVE_TODO((id) => (state) => {
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
    on.SET_VISIBILITY_FILTER((filter) => (state) => state.visibilityFilter = filter)
  })
})
```




### 주요 개념

- State
- Store


- Action
- Dispatch
- On
- Reducer(+Computed)


- Draft



### 영감을 받은 개념

- CQRS 
- Redux(Single Source, Reducer)
- NgRx(Effect)



## 특징

### 강력한 타입 시스템과 자동완성
- StateForge는 TypeScript의 강력한 타입 시스템을 기반으로 구축되었습니다. 이는 개발 중에 높은 수준의 자동완성 지원을 제공하며, 타입 관련 오류를 사전에 방지할 수 있게 해줍니다. 개발자가 코드를 작성할 때 필요한 속성이나 액션을 쉽게 찾을 수 있도록 도와줍니다.

### 최소한의 보일러플레이트
- Redux와 같은 기존의 상태 관리 라이브러리들은 많은 설정과 보일러플레이트 코드가 필요합니다. StateForge는 이런 부분을 대폭 간소화하여 개발자가 비즈니스 로직에 더 집중할 수 있도록 설계되었습니다. 필요한 기능을 몇 줄의 코드로 간결하게 표현할 수 있습니다.

### Redux Toolkit + Jotai + Zustand + Valtio = ?
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

---

# Core Concept

## Store

"Store"라는 용어는 상점(store)에서 유래했습니다. 상점처럼 다양한 물건을 한 곳에 모아두고 필요할 때 꺼내 쓰는 것과 비슷하게, 상태 관리에서의 store는 애플리케이션의 다양한 데이터(State)를 하나의 장소에 저장하고 필요할 때 컴포넌트가 접근하여 사용할 수 있도록 합니다.

이러한 중앙 집중식 관리 방식은 데이터의 일관성을 유지하고, 상태 변화에 대한 추적과 디버깅을 용이하게 합니다. 또한, 애플리케이션의 상태를 한 곳에서 관리함으로써 데이터 흐름을 보다 명확하게 만들고, 복잡한 상태 관리를 단순화하는 데 도움이 됩니다.


### Store의 역할

- 상태 보관: 애플리케이션의 전체 상태를 하나의 객체로 저장합니다.
- 상태 접근: 컴포넌트에서 store의 상태에 접근할 수 있게 합니다.
- 상태 갱신: 액션을 통해 상태를 변경하고, 이에 대응하는 리듀서로 새로운 상태를 생성합니다.
- 구독 관리: 상태 변화를 구독하고 있는 컴포넌트에 변화를 알립니다.


---

## Reducer

- 요구사항을 구현하는 것는 동작을 데이터로 변경하기
- ex) turnOnLight() vs isLight = true
- 그런데 프로그램이 복잡해지면 값으로만 기술하다 이게 어떤 동작인지 이해가 어려워진다.
- 직접 값을 수정하다 보면 실수를 할 수 있게 된다.
- **"해법: 상태(State)의 변화를 액션과 리듀서로 분리하기"**

### 장점:
- 데이터의 변화의 기술을 데이터 scope내에서 작성해서 데이터의 변화를 추적할 수 있다.
- 프로그램을 값의 변화가 아니라 요구사항과 비슷한 형태로 작성할 수 있게 된다.

### 단점:
- 조금 더 귀찮아야 한다.
- 문법이 복잡해진다(?)
  - => 간단하게 on이라는 helper객체를 제공해서 보일러 플레이트를 줄였다!
  - => immer와 같이 불변성을 유지하면서 단순한 문법으로 작성할 수 있게 해결했다.


```ts
store.Todo = reducer([], on => {
  on.ADD_TODO((text) => (state) => {
    const newTodo = {id: Date.now(), text, completed: false}
    state.Todo[id] = newTodo
  })

  on.TOGGLE_TODO((id) => (state) => {
    state.Todo[id].completed = !state.Todo[id].completed
  })

  on.REMOVE_TODO((id) => (state) => {
    delete state.Todo[id]
  })
})
```

### 왜 Reducer에서 state를 직접 수정하나요?

- 자바스크립트는 불변성을 언어차원에서 지원하지 않으므로 상당히 불편한 코드를 작성해야 합니다.
- ReactForge에서는 자동으로 불변성을 유지하는 코드를 작성해줍니다. (like Immer)

```ts
// 결국 순수함수 형태로 제공된다. 
function createReducer(state, action, reducerFn) {
  const draft = clone(state) // 구조적 공유를 통한 효과적인 복사
  const on = helper(action)
  reducerFn(on)(draft)
  return draft
}
```

---
### classicReducer

> 🤔 (상상) classicReducer도 마이그레이션용으로 제공해 볼까??

```ts
function todoReducer(state = {Todo:{}}, action) {
  
  switch (action.type) {
    case "ADD_TODO": {
      const {text} = action.payload
      const todo = {id: Date.now(), text, completed: false}
      return {...state, Todo: {...state.Todo, [todo.id]: todo}} 
    }

    case "TOGGLE_TODO": {
      const {id} = action.payload
      const completed = !state.Todo[id].completed
      return {...state, Todo: {...state.Todo, [id]: {...state.Todo[id], completed}}}
    }

    case "REMOVE_TODO": {
      const {id} = action.payload
      const {[id]: value, ...newTodo} = state.Todo;
      return {...state, Todo: newTodo};
      delete newState.Todo[id];
    }
  }
  
  return state
}

store.todo = classicReducer(TodoReducer)
```

---


## On


```ts

// on.ACTION(params => (state) => state.value++))
on.INCREASE(by => (state) => state.count)

// on 함수를 이용하면, 하나의 함수로 2가지 액션에 대응할 수 있다.
on(on.INCREASE, on.DECREASE)((inc, dec) => (state) => {
  acount = inc ? inc : -dec
  state.count += amount
})
        
// on 함수와 store를 결합하여 해당 값이 바뀔때 액션으로 받을 수 있다.        
// like Rxjs's combineLastest
// each value changes, but every value is not undefined
on(store.account.id, store.User)((accountId, User) => (state) => {
  const user = User[accountId]
  if(!user) return
  state.account.name = user.name
})

// SUCCESS or FAILURE or onChange(store.User)
on(on.SUCCESS, on.FAILURE, store.User)((succ, fail, user) => (state) => {
  if (succ) state.ok = true
  else if (fail) state.ok = false
  else state.ok = !!user
})
```














# Advanced

## Advanced Action

### Action Slot Pilling

```ts
interface Actions {
  ADD_TODO(text:string, id?:number):void
}

// action middleware
store.dispatch.ADD_TODO = (text:string, id:number = Date.now()) => {
  return [text, id]
}

store.Todo = reducer([], (on) => {
  on.ADD_TODO((text, id) => (state) => {
    state.Todo[id] = {id, text, complted: false}
  })

  /* Bad 
  on.ADD_TODO((text) => (state) => {
    // Date.now() is not pure!
    const newTodo = {id: Date.now(), text, completed: false}
    state.Todo[id] = newTodo
  })
  */
})


function Component() {
  const someHandler = (msg:string) => dispatch.ADD_TODO(msg)
  return <></>
}
```

### Async Action

Promise를 return하면 SUCCESS, FAILTURE, SETTLED 액션이 자동으로 생성되어 호출된다.

```ts

// async action (promise)
store.dispatch.ADD_TODO_ASYNC = (text:string, id:string) => {
  return new Promise(resolve => setTimeout(() => resolve([text, id]), 1000)
}

store.Todo = reducer({}, on => {
  on.ADD_TODO_ASYNC.REQUEST(res => (state) => {
    /* ... */
  })

  on.ADD_TODO_ASYNC.SUCCESS(res => (state) => {
    /* ... */
  })

  on.ADD_TODO_ASYNC.FAILTURE(res => (state) => {
    /* ... */
  })

  on.ADD_TODOADD_TODO.COMPLETED(res => (state) => {
    /* ... */
  })
})
```

### Mutation

실전 예제: API 연동,

```ts
interface Todo {
  id:string
  text:string
  completed:boolean
}

interface Actions {
  ADD_TODO: {
    (text:string):(dispatch)=>Promise
    REQUEST(todo:Todo)
    SUCCESS(todo:Todo)
    FAILTURE(error:Error)
  }

  REMOVE_TODO: {
    
  }
}

store.dispatch.ADD_TODO = (text:string) => (dispatch) => {
  const id = Math.random().toString(36).slice(2)
  const newTodo = {id, text, completed: false}
  return dispatch.REQUEST(newTodo, api.POST("/todos")(newTodo).then(res => res.data))
}

store.dispatch.REMOVE_TODO = (id:string) => (dispatch) => {
  return dispatch.REQUEST(id, api.DELETE("/todos/:id")(id))
}


store.dispatch.REMOVE_TODO = mutation((id:string) => api.DELETE("/todos/:id")(id))

store.dispatch.ADD_TODO = mutation(
  (text) => {
    const id = Math.random().toString(36).slice(2)
    return {id, text, completed: false}
  },
  (newTodo) => api.POST("/todos")(newTodo)
)




store.dispatch.ADD_TODO = mutation()
        .onMutate(text => {
          const id = Math.random().toString(36).slice(2)
          return {id, text, completed: false}
        })
        .mutateFn(newTodo => api.POST("/todos")(newTodo))
        .onSuccess(() => invalidate("/todos/", id)
)




store.Todo = reducer([], (on, effect) => {
  
  on.ADD_TODO.REQUEST(newTodo => (state) => {
    state.Todo[id] = newTodo
  })

  on.ADD_TODO.SUCCESS((todo, context) => {
    delete state.Todo[context.id]
    state.Todo[todo.id] = todo
  })

  // request때 컨텐츠는 자동으로 복원된다.
  on.ADD_TODO.FAILTURE((todo, context) => {
    /* TODO */
  })
  
  on.TOGGLE_TODO((id) => (state) => {
    state.Todo[id].completed = !state.Todo[id].completed
  })

  on.REMOVE_TODO.REQUEST((id) => (state) => {
    delete state.Todo[id]
  })
})
```

```ts


store.dispatch.REMOVE_TODO = (id:string) => (dispatch, transaction) => {
  return dispatch.REQUEST(id, transaction(state => {
    delete state.Todo[id]
    return api.DELETE("/todos/:id")(id)
  }))
}




```



> 그밖에 Action 확장 생각거리들..


- **.CANCELED**: 진행 중인 비동기 작업을 취소하는 액션입니다. 사용자가 요청을 중단하거나 다른 작업으로 전환할 때 유용합니다.


- **.RETRY**: 실패한 비동기 작업을 다시 시도하는 액션입니다. FAILURE 후에 네트워크 상태가 개선되거나 오류가 수정된 경우 유용합니다.


- **.THROTTLE / .DEBOUNCE**: 요청의 빈도를 조절하는 액션입니다. 예를 들어, 사용자 입력에 따른 자동 완성 기능에서 서버 부하를 줄이기 위해 사용될 수 있습니다.


- **.UPDATE**: 진행 중인 비동기 작업에 대한 중간 업데이트를 제공하는 액션입니다. 예를 들어, 파일 업로드의 진행 상황을 표시할 때 사용될 수 있습니다.


- **.POLLING_START / ,POLLING_STOP**: 정기적으로 데이터를 요청하는 폴링(polling) 작업을 시작하거나 중단하는 액션입니다. 실시간 업데이트가 필요한 경우 사용될 수 있습니다.

---

## 개발 멘탈 모델

1. 컴포넌트에서는 1)값과 2)dispatch만 사용한다.
   1. 변하는 값을 value로 만들고 State에 등록한다.
   2. 이벤트 핸들러는 그대로 dispatch하고 Action을 등록한다.
3. 해당 Action을 하고 나면 어떤 값이 바뀌어야 하는지 생각해본다.
   1. 바뀌는 값의 reducer에 가서 on.ACTION 이후 값을 변화 시킨다.
4. 요구사항을 생각해본다. 
   1. 어떤 값이 바뀌어야 하는가?
   2. 그 값이 바뀌기 위해서 어떤 데이터가 필요한가?
   3. 언제 그값이 바뀌어야 하는가?
      1. 항상 특정 데이터가 추가로 필요하다면 on(store.data.path)를 이용한다.
      2. 특정 시점이 필요하다면 disaptch.ACTION을 통해서 해결한다.


   



## 추가 예정

- ~~비동기 액션 처리~~
- 이펙트 처리
- 상태 추적 및 디버깅
- 테스트 코드 작성하기
- 상태관리 멘탈 모델
- 조건부 스토리
- 엔티티와 데이터 정규화(Normalize)
- createComponentStore()
- 등등...
- 

---


## Create API

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

