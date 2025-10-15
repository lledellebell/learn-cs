---
title: JavaScript에서 Mutation vs Non-Mutation
date: 2025-10-02
categories: [Programming, JavaScript]
tags: [Mutation, Immutability, React, State Management, Reference vs Value]
layout: page
---
# React 상태가 업데이트되지 않는 이유 - Mutation의 비밀

저도 처음 React를 배울 때 이런 경험을 했습니다. 분명히 배열에 새 항목을 추가했는데, 화면에는 아무것도 나타나지 않았습니다.

```jsx
function TodoList() {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => {
    todos.push({ id: Date.now(), text }); // 왜 안 될까?
    setTodos(todos);
  };

  // 화면이 업데이트되지 않음!
}
```

디버거를 찍어보면 `todos` 배열에는 분명히 새 항목이 들어가 있습니다. 하지만 React는 재렌더링하지 않습니다. 혹시 이런 경험 있나요?

이 문제의 핵심은 **Mutation(변이)**입니다. JavaScript에서 데이터를 다루는 방식을 제대로 이해하지 못하면 이런 버그는 계속 발생합니다. 더 심각한 건, 이런 버그는 찾기도 어렵고 디버깅도 까다롭다는 것입니다.

이 문서에서는 Mutation이 무엇인지, 왜 중요한지, 그리고 어떻게 제대로 다뤄야 하는지 실전 예제와 함께 자세히 알아보겠습니다.

## 왜 Mutation을 이해해야 할까요?

### 1. React와 상태 관리의 핵심

React는 상태가 변경되었는지를 **참조 비교**(Reference Equality)로 확인합니다.

```js
const oldState = [1, 2, 3];
const newState = oldState;
newState.push(4);

console.log(oldState === newState); // true - 같은 객체!
// React는 "변경 없음"이라고 판단합니다
```

Redux, Zustand, Jotai 같은 상태 관리 라이브러리도 마찬가지입니다. 불변성(Immutability)을 지키지 않으면 제대로 동작하지 않습니다.

### 2. 예측 가능한 코드 작성

Mutation은 "부작용(Side Effect)"을 만듭니다. 함수가 외부 데이터를 변경하면 예측하기 어려워집니다.

```js
// 나쁜 예: 예측 불가능
function addUser(users, newUser) {
  users.push(newUser); // 원본 수정!
  return users;
}

const team = [{ name: 'Alice' }];
const updatedTeam = addUser(team, { name: 'Bob' });

console.log(team); // [{ name: 'Alice' }, { name: 'Bob' }]
// 원본이 변경됨! 다른 코드에 영향을 줄 수 있음
```

```js
// 좋은 예: 예측 가능
function addUser(users, newUser) {
  return [...users, newUser]; // 새 배열 생성
}

const team = [{ name: 'Alice' }];
const updatedTeam = addUser(team, { name: 'Bob' });

console.log(team); // [{ name: 'Alice' }] - 원본 유지
console.log(updatedTeam); // [{ name: 'Alice' }, { name: 'Bob' }]
```

### 3. 버그 추적과 디버깅

상태 변화를 추적할 수 있으면 디버깅이 훨씬 쉬워집니다. 불변성을 지키면 Redux DevTools 같은 도구로 시간 여행 디버깅(Time Travel Debugging)이 가능합니다.

```js
// Mutation 방식: 추적 불가능
const state1 = { count: 0 };
state1.count++; // state1이 변경됨
state1.count++; // 또 변경됨
// 이전 상태를 확인할 방법이 없음

// Non-Mutation 방식: 추적 가능
const state1 = { count: 0 };
const state2 = { ...state1, count: state1.count + 1 };
const state3 = { ...state2, count: state2.count + 1 };
// state1, state2, state3 모두 독립적으로 존재
// 각 단계를 확인하고 되돌릴 수 있음
```

## 기본 개념: 참조와 값의 세계

### 메모리 모델 이해하기

JavaScript에서 데이터는 두 가지 방식으로 저장됩니다.

#### 원시 타입 (Primitive Types): 값으로 저장

```js
let a = 5;
let b = a; // 값 복사
a = 10;

console.log(a); // 10
console.log(b); // 5 - 독립적!

/*
메모리 구조:
┌─────────┐
│ a: 10   │ ← 0x1000
└─────────┘
┌─────────┐
│ b: 5    │ ← 0x2000
└─────────┘
각자 독립적인 메모리 공간
*/
```

#### 참조 타입 (Reference Types): 주소로 저장

```js
let obj1 = { value: 5 };
let obj2 = obj1; // 주소 복사
obj1.value = 10;

console.log(obj1.value); // 10
console.log(obj2.value); // 10 - 함께 변경됨!

/*
메모리 구조:
obj1 ──┐
       ├──→ ┌─────────────┐
obj2 ──┘    │ { value: 10 }│ ← 0x3000
            └─────────────┘
둘 다 같은 객체를 가리킴
*/
```

### Mutation vs Non-Mutation 비교

#### Mutation (변이): 원본 수정

```js
const arr = [1, 2, 3];
arr.push(4); // 원본 수정
console.log(arr); // [1, 2, 3, 4]

/*
메모리 상태:
Before: 0x1000 [1, 2, 3]
After:  0x1000 [1, 2, 3, 4] ← 같은 주소, 내용만 변경
*/
```

#### Non-Mutation (불변성): 새 데이터 생성

```js
const arr = [1, 2, 3];
const newArr = arr.concat(4); // 새 배열 생성
console.log(arr); // [1, 2, 3] - 원본 유지
console.log(newArr); // [1, 2, 3, 4]

/*
메모리 상태:
arr:    0x1000 [1, 2, 3]
newArr: 0x2000 [1, 2, 3, 4] ← 새 주소
*/
```

## 실전 예제: 배열 다루기

### 1. 배열에 항목 추가하기

#### ❌ 나쁜 예: push() 사용 (Mutation)

```js
function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: '장보기', done: false }
  ]);

  const addTodo = (text) => {
    todos.push({ id: Date.now(), text, done: false });
    setTodos(todos); // React가 변경을 감지하지 못함!
  };

  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>{todo.text}</div>
      ))}
      <button onClick={() => addTodo('운동하기')}>
        추가
      </button>
    </div>
  );
  // 버튼을 눌러도 화면이 업데이트되지 않음!
}
```

**문제점:**
- `todos.push()`는 원본 배열을 수정합니다
- `setTodos(todos)`에서 `todos`는 여전히 같은 참조입니다
- React는 `oldTodos === newTodos`가 `true`이므로 재렌더링하지 않습니다

#### ✅ 좋은 예: 스프레드 연산자 사용

```js
function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: '장보기', done: false }
  ]);

  const addTodo = (text) => {
    const newTodo = { id: Date.now(), text, done: false };
    setTodos([...todos, newTodo]); // 새 배열 생성!
  };

  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>{todo.text}</div>
      ))}
      <button onClick={() => addTodo('운동하기')}>
        추가
      </button>
    </div>
  );
  // 정상 작동!
}
```

#### ✅ 다른 방법들

```js
// concat() 사용
setTodos(todos.concat(newTodo));

// Array.prototype.push() + slice() (비추천, 비효율적)
const temp = todos.slice();
temp.push(newTodo);
setTodos(temp);
```

### 2. 배열에서 항목 제거하기

#### ❌ 나쁜 예: splice() 사용 (Mutation)

```js
const removeTodo = (id) => {
  const index = todos.findIndex(todo => todo.id === id);
  todos.splice(index, 1); // 원본 수정!
  setTodos(todos); // 변경 감지 안 됨
};
```

#### ✅ 좋은 예: filter() 사용

```js
const removeTodo = (id) => {
  setTodos(todos.filter(todo => todo.id !== id));
};

// 실제 사용
<button onClick={() => removeTodo(todo.id)}>삭제</button>
```

**왜 좋을까?**
- `filter()`는 새 배열을 반환합니다
- 원본은 그대로 유지됩니다
- React가 변경을 정확히 감지합니다

### 3. 배열 항목 수정하기

이것이 가장 까다롭습니다. 배열 안의 객체를 수정할 때는 배열도 새로 만들고, 객체도 새로 만들어야 합니다.

#### ❌ 나쁜 예: 직접 수정 (Mutation)

```js
const toggleTodo = (id) => {
  const todo = todos.find(t => t.id === id);
  todo.done = !todo.done; // 객체 직접 수정!
  setTodos(todos); // 변경 감지 안 됨
};
```

#### ❌ 더 나쁜 예: 배열만 새로 만들기

```js
const toggleTodo = (id) => {
  const todo = todos.find(t => t.id === id);
  todo.done = !todo.done; // 여전히 객체 수정!
  setTodos([...todos]); // 배열은 새로 만들었지만...
};

/*
문제:
┌─────────────────────────────────┐
│ oldTodos: [todo1, todo2, todo3] │ ← 0x1000
└─────────────────────────────────┘
           ↓
┌─────────────────────────────────┐
│ newTodos: [todo1, todo2, todo3] │ ← 0x2000 (새 배열)
└─────────────────────────────────┘
            ↓      ↓      ↓
            모두 같은 객체를 참조!
            todo1: 0x3000
            todo2: 0x4000
            todo3: 0x5000

배열은 다르지만 안의 객체는 같음!
*/
```

#### ✅ 좋은 예: map()으로 새 배열과 새 객체 생성

```js
const toggleTodo = (id) => {
  setTodos(todos.map(todo =>
    todo.id === id
      ? { ...todo, done: !todo.done } // 새 객체 생성
      : todo // 변경되지 않은 항목은 그대로
  ));
};

/*
메모리 구조:
Before:
oldTodos: [todo1, todo2, todo3] ← 0x1000
          0x3000 0x4000 0x5000

After (todo2를 수정했다면):
newTodos: [todo1, todo2', todo3] ← 0x2000 (새 배열)
          0x3000 0x6000  0x5000
                  ↑
                  새 객체!
*/
```

### 4. 복잡한 예제: 중첩된 배열 수정

실제 앱에서는 데이터가 더 복잡합니다.

```js
const [projects, setProjects] = useState([
  {
    id: 1,
    name: '프로젝트 A',
    tasks: [
      { id: 101, title: '디자인', done: false },
      { id: 102, title: '개발', done: false }
    ]
  },
  {
    id: 2,
    name: '프로젝트 B',
    tasks: [
      { id: 201, title: '기획', done: true }
    ]
  }
]);
```

#### ❌ 나쁜 예: 깊은 곳의 데이터 직접 수정

```js
const toggleTask = (projectId, taskId) => {
  const project = projects.find(p => p.id === projectId);
  const task = project.tasks.find(t => t.id === taskId);
  task.done = !task.done; // 깊은 곳의 객체 수정!
  setProjects([...projects]); // 1단계만 복사
};

// 이것도 작동하지 않음!
```

#### ✅ 좋은 예: 모든 레벨 새로 생성

```js
const toggleTask = (projectId, taskId) => {
  setProjects(projects.map(project =>
    project.id === projectId
      ? {
          ...project, // 프로젝트 객체 복사
          tasks: project.tasks.map(task =>
            task.id === taskId
              ? { ...task, done: !task.done } // task 객체 복사
              : task
          )
        }
      : project
  ));
};

/*
변경 경로:
projects (새 배열)
  └─ project (새 객체)
      └─ tasks (새 배열)
          └─ task (새 객체) ← done 필드 변경

모든 레벨을 새로 생성!
*/
```

**복잡하다고 느껴지나요?** 맞습니다. 이럴 때 Immer 같은 라이브러리를 사용하면 훨씬 간단해집니다 (나중에 다룰 예정).

## 실전 예제: 객체 다루기

### 1. 객체 속성 변경하기

#### ❌ 나쁜 예: 직접 수정

```js
function UserProfile() {
  const [user, setUser] = useState({
    name: '홍길동',
    age: 30,
    email: 'hong@example.com'
  });

  const updateName = (newName) => {
    user.name = newName; // 직접 수정!
    setUser(user); // 변경 감지 안 됨
  };
}
```

#### ✅ 좋은 예: 스프레드 연산자

```js
const updateName = (newName) => {
  setUser({ ...user, name: newName });
};

// 여러 속성 동시 변경
const updateProfile = (name, age) => {
  setUser({ ...user, name, age });
};
```

### 2. 중첩된 객체 수정하기

```js
const [user, setUser] = useState({
  name: '홍길동',
  address: {
    city: '서울',
    district: '강남구',
    detail: '테헤란로 123'
  },
  preferences: {
    theme: 'light',
    language: 'ko'
  }
});
```

#### ❌ 나쁜 예: 일부만 복사

```js
const updateCity = (newCity) => {
  user.address.city = newCity; // 깊은 수정!
  setUser({ ...user }); // 1단계만 복사
};

// 또는
const updateCity = (newCity) => {
  const newUser = { ...user };
  newUser.address.city = newCity; // 여전히 같은 address 객체!
  setUser(newUser);
};

/*
문제:
oldUser: {
  name: '홍길동',
  address: 0x1000 ──┐
}                   ↓
                ┌─────────────┐
newUser: {      │  { city: ... }│ ← 같은 객체!
  name: '홍길동', └─────────────┘
  address: 0x1000 ──┘
}
*/
```

#### ✅ 좋은 예: 모든 레벨 복사

```js
const updateCity = (newCity) => {
  setUser({
    ...user, // 사용자 객체 복사
    address: {
      ...user.address, // address 객체 복사
      city: newCity // city만 변경
    }
  });
};

/*
메모리 구조:
oldUser (0x1000):
  ├─ name: '홍길동'
  └─ address (0x2000):
      ├─ city: '서울'
      ├─ district: '강남구'
      └─ detail: '테헤란로 123'

newUser (0x3000):
  ├─ name: '홍길동' (같은 값)
  └─ address (0x4000): ← 새 객체!
      ├─ city: '부산' ← 변경됨
      ├─ district: '강남구'
      └─ detail: '테헤란로 123'
*/
```

### 3. 매우 깊은 중첩 구조

```js
const [data, setData] = useState({
  user: {
    profile: {
      personal: {
        name: '홍길동',
        contact: {
          phone: '010-1234-5678',
          email: 'hong@example.com'
        }
      }
    }
  }
});
```

#### ✅ 순수 JavaScript 방식 (복잡함)

```js
const updatePhone = (newPhone) => {
  setData({
    ...data,
    user: {
      ...data.user,
      profile: {
        ...data.user.profile,
        personal: {
          ...data.user.profile.personal,
          contact: {
            ...data.user.profile.personal.contact,
            phone: newPhone
          }
        }
      }
    }
  });
};

// 읽기도 어렵고, 실수하기 쉬움!
```

#### ✅ Immer 라이브러리 사용 (권장)

```js
import { produce } from 'immer';

const updatePhone = (newPhone) => {
  setData(produce(draft => {
    draft.user.profile.personal.contact.phone = newPhone;
  }));
};

// 마치 직접 수정하는 것처럼 쓸 수 있지만,
// 내부적으로는 불변성을 지킴!
```

## 좋은 예 vs 나쁜 예: Array 메서드

### Mutating 메서드 (원본 변경) ❌

```js
const arr = [1, 2, 3];

// push() - 끝에 추가
arr.push(4); // [1, 2, 3, 4] - 원본 변경됨
console.log(arr); // [1, 2, 3, 4]

// pop() - 끝에서 제거
arr.pop(); // [1, 2, 3] - 원본 변경됨

// shift() - 앞에서 제거
arr.shift(); // [2, 3] - 원본 변경됨

// unshift() - 앞에 추가
arr.unshift(0); // [0, 2, 3] - 원본 변경됨

// splice() - 중간 삽입/삭제
arr.splice(1, 1); // [0, 3] - 원본 변경됨
arr.splice(1, 0, 1, 2); // [0, 1, 2, 3] - 원본 변경됨

// sort() - 정렬
arr.sort((a, b) => b - a); // [3, 2, 1, 0] - 원본 변경됨

// reverse() - 뒤집기
arr.reverse(); // [0, 1, 2, 3] - 원본 변경됨

// fill() - 특정 값으로 채우기
arr.fill(0); // [0, 0, 0, 0] - 원본 변경됨

// React/Redux에서는 사용하면 안 됨!
```

### Non-Mutating 메서드 (새 배열 생성) ✅

```js
const arr = [1, 2, 3];

// concat() - 배열 합치기
const arr1 = arr.concat(4); // [1, 2, 3, 4]
console.log(arr); // [1, 2, 3] - 원본 유지

// slice() - 부분 복사
const arr2 = arr.slice(1, 3); // [2, 3]
console.log(arr); // [1, 2, 3] - 원본 유지

// map() - 변환
const arr3 = arr.map(x => x * 2); // [2, 4, 6]
console.log(arr); // [1, 2, 3] - 원본 유지

// filter() - 필터링
const arr4 = arr.filter(x => x > 1); // [2, 3]
console.log(arr); // [1, 2, 3] - 원본 유지

// reduce() - 축약
const sum = arr.reduce((acc, x) => acc + x, 0); // 6
console.log(arr); // [1, 2, 3] - 원본 유지

// spread operator - 복사/합치기
const arr5 = [...arr, 4, 5]; // [1, 2, 3, 4, 5]
const arr6 = [0, ...arr]; // [0, 1, 2, 3]
const arr7 = [0, ...arr, 4]; // [0, 1, 2, 3, 4]

// toSorted() - 정렬 (ES2023)
const arr8 = arr.toSorted((a, b) => b - a); // [3, 2, 1]
console.log(arr); // [1, 2, 3] - 원본 유지

// toReversed() - 뒤집기 (ES2023)
const arr9 = arr.toReversed(); // [3, 2, 1]
console.log(arr); // [1, 2, 3] - 원본 유지

// React/Redux에서는 이런 메서드들을 사용!
```

### 실전 변환 패턴

#### 1. push() → 스프레드 연산자

```js
// ❌ Mutation
arr.push(4);

// ✅ Non-Mutation
const newArr = [...arr, 4];
```

#### 2. unshift() → 스프레드 연산자

```js
// ❌ Mutation
arr.unshift(0);

// ✅ Non-Mutation
const newArr = [0, ...arr];
```

#### 3. splice() → slice() + 스프레드

```js
// ❌ Mutation: 중간에 삽입
arr.splice(2, 0, 'new');

// ✅ Non-Mutation
const newArr = [...arr.slice(0, 2), 'new', ...arr.slice(2)];

// ❌ Mutation: 중간에서 제거
arr.splice(1, 1);

// ✅ Non-Mutation
const newArr = [...arr.slice(0, 1), ...arr.slice(2)];
// 또는 filter 사용
const newArr = arr.filter((_, index) => index !== 1);
```

#### 4. sort() → toSorted() 또는 slice() + sort()

```js
// ❌ Mutation
arr.sort();

// ✅ Non-Mutation (ES2023)
const newArr = arr.toSorted();

// ✅ Non-Mutation (이전 버전)
const newArr = [...arr].sort();
// 또는
const newArr = arr.slice().sort();
```

#### 5. reverse() → toReversed() 또는 slice() + reverse()

```js
// ❌ Mutation
arr.reverse();

// ✅ Non-Mutation (ES2023)
const newArr = arr.toReversed();

// ✅ Non-Mutation (이전 버전)
const newArr = [...arr].reverse();
```

## 활용: 복사 전략

### 1. 얕은 복사 (Shallow Copy)

```js
const original = {
  name: '홍길동',
  age: 30,
  hobbies: ['독서', '운동']
};

// 방법 1: 스프레드 연산자
const copy1 = { ...original };

// 방법 2: Object.assign()
const copy2 = Object.assign({}, original);

// 방법 3: 배열의 경우
const arr = [1, 2, 3];
const arrCopy1 = [...arr];
const arrCopy2 = arr.slice();
const arrCopy3 = Array.from(arr);

/*
주의: 얕은 복사의 함정!
*/
copy1.name = '김철수'; // OK - 원본에 영향 없음
copy1.hobbies.push('게임'); // 위험! - 원본도 변경됨

console.log(original.hobbies); // ['독서', '운동', '게임']

/*
왜 이럴까?
copy1: {
  name: '김철수',    ← 새 값
  age: 30,           ← 복사된 값
  hobbies: 0x2000 ───┐
}                    │
                     │
original: {          │
  name: '홍길동',     ← 원본 값
  age: 30,           │
  hobbies: 0x2000 ───┘ ← 같은 배열을 참조!
}

hobbies 배열은 복사되지 않고 참조만 복사됨!
*/
```

### 2. 깊은 복사 (Deep Copy)

#### 방법 1: structuredClone() (권장, 최신)

```js
const original = {
  name: '홍길동',
  age: 30,
  address: {
    city: '서울',
    district: '강남구'
  },
  hobbies: ['독서', '운동']
};

const deepCopy = structuredClone(original);

// 깊은 속성을 변경해도 원본에 영향 없음
deepCopy.address.city = '부산';
deepCopy.hobbies.push('게임');

console.log(original.address.city); // '서울' - 원본 유지
console.log(original.hobbies); // ['독서', '운동'] - 원본 유지

/*
메모리 구조:
original:
  ├─ name: '홍길동'
  ├─ address (0x1000): { city: '서울', district: '강남구' }
  └─ hobbies (0x2000): ['독서', '운동']

deepCopy:
  ├─ name: '홍길동'
  ├─ address (0x3000): { city: '부산', district: '강남구' } ← 새 객체!
  └─ hobbies (0x4000): ['독서', '운동', '게임'] ← 새 배열!

완전히 독립적!
*/
```

**structuredClone의 장점:**
- 중첩된 모든 객체/배열을 재귀적으로 복사
- Date, Map, Set, RegExp 등도 제대로 복사
- 순환 참조도 처리 가능

**제한사항:**
- 함수는 복사되지 않음
- DOM 노드는 복사 불가
- Symbol은 복사되지 않음

#### 방법 2: JSON 방식 (간단하지만 제한적)

```js
const original = {
  name: '홍길동',
  age: 30,
  address: { city: '서울' },
  createdAt: new Date('2024-01-01')
};

const deepCopy = JSON.parse(JSON.stringify(original));

deepCopy.address.city = '부산';
console.log(original.address.city); // '서울' - 원본 유지
```

**JSON 방식의 문제점:**

```js
const data = {
  name: '홍길동',
  date: new Date(),          // Date → 문자열로 변환
  func: () => console.log('hi'), // 함수 → 사라짐
  undef: undefined,          // undefined → 사라짐
  symbol: Symbol('test'),    // Symbol → 사라짐
  nan: NaN,                  // NaN → null
  infinity: Infinity,        // Infinity → null
  regex: /test/g             // RegExp → 빈 객체
};

const copy = JSON.parse(JSON.stringify(data));

console.log(copy);
// {
//   name: '홍길동',
//   date: '2024-01-01T00:00:00.000Z', // 문자열!
//   nan: null,
//   infinity: null,
//   regex: {}
// }
```

#### 방법 3: 재귀 함수 (완전한 제어)

```js
function deepClone(obj) {
  // 원시 타입이면 그대로 반환
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Date 객체
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  // 배열
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }

  // 일반 객체
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

// 사용
const original = {
  name: '홍길동',
  dates: [new Date(), new Date()],
  nested: { deep: { value: 123 } }
};

const copy = deepClone(original);
copy.nested.deep.value = 456;
console.log(original.nested.deep.value); // 123 - 원본 유지
```

#### 방법 4: Lodash 라이브러리

```js
import { cloneDeep } from 'lodash';

const original = {
  name: '홍길동',
  address: { city: '서울' },
  hobbies: ['독서', '운동']
};

const copy = cloneDeep(original);
```

### 3. 선택적 깊은 복사 (성능 최적화)

모든 것을 깊은 복사하면 성능이 떨어질 수 있습니다. 변경이 필요한 부분만 복사하세요.

```js
const state = {
  users: [...], // 1000개 항목
  products: [...], // 5000개 항목
  cart: {
    items: [
      { id: 1, quantity: 2 }
    ]
  }
};

// ❌ 비효율적: 모든 것을 깊은 복사
const newState = structuredClone(state);
newState.cart.items[0].quantity = 3;

// ✅ 효율적: 필요한 부분만 복사
const newState = {
  ...state, // users, products는 참조 유지
  cart: {
    ...state.cart,
    items: state.cart.items.map((item, index) =>
      index === 0
        ? { ...item, quantity: 3 } // 이 항목만 복사
        : item // 나머지는 참조 유지
    )
  }
};

/*
메모리 효율:
- users 배열: 참조 유지 (복사 안 함)
- products 배열: 참조 유지 (복사 안 함)
- cart 객체: 새로 생성
- items 배열: 새로 생성
- items[0]: 새로 생성
- items[1...]: 참조 유지

변경이 필요한 최소한만 복사!
*/
```

## 함정과 주의사항

### 1. 얕은 복사의 함정

```js
const user = {
  name: '홍길동',
  preferences: {
    theme: 'dark',
    notifications: {
      email: true,
      push: false
    }
  }
};

// ❌ 1단계만 복사
const updated = { ...user };
updated.preferences.theme = 'light'; // 원본도 변경됨!

console.log(user.preferences.theme); // 'light' - 원본 변경!

// ✅ 필요한 만큼 복사
const updated = {
  ...user,
  preferences: {
    ...user.preferences,
    theme: 'light'
  }
};

console.log(user.preferences.theme); // 'dark' - 원본 유지
```

### 2. 배열 안의 객체

```js
const todos = [
  { id: 1, text: '장보기', done: false },
  { id: 2, text: '운동하기', done: false }
];

// ❌ 배열만 복사
const newTodos = [...todos];
newTodos[0].done = true; // 원본도 변경됨!

console.log(todos[0].done); // true - 원본 변경!

/*
왜 이럴까?
todos:    [todo1, todo2] ← 0x1000
           0x2000 0x3000

newTodos: [todo1, todo2] ← 0x4000 (새 배열)
           0x2000 0x3000 (같은 객체들!)
*/

// ✅ 배열과 객체 모두 복사
const newTodos = todos.map(todo =>
  todo.id === 1
    ? { ...todo, done: true } // 변경할 항목만 복사
    : todo // 나머지는 참조 유지
);

console.log(todos[0].done); // false - 원본 유지
```

### 3. 객체 안의 배열

```js
const user = {
  name: '홍길동',
  hobbies: ['독서', '운동']
};

// ❌ 객체만 복사
const newUser = { ...user };
newUser.hobbies.push('게임'); // 원본도 변경됨!

console.log(user.hobbies); // ['독서', '운동', '게임'] - 원본 변경!

// ✅ 객체와 배열 모두 복사
const newUser = {
  ...user,
  hobbies: [...user.hobbies, '게임']
};

console.log(user.hobbies); // ['독서', '운동'] - 원본 유지
```

### 4. React에서 흔한 실수

#### 실수 1: useState의 초기값 직접 수정

```js
function App() {
  const initialState = { count: 0 };
  const [state, setState] = useState(initialState);

  // ❌ 나중에 초기값을 직접 수정하면 안 됨!
  const reset = () => {
    initialState.count = 0; // 위험!
    setState(initialState);
  };

  // ✅ 항상 새 객체 생성
  const reset = () => {
    setState({ count: 0 });
  };
}
```

#### 실수 2: 이전 상태를 직접 참조

```js
// ❌ 나쁜 예
const handleIncrement = () => {
  count++; // 상태를 직접 수정
  setCount(count);
};

// ✅ 좋은 예
const handleIncrement = () => {
  setCount(count + 1);
};

// ✅ 더 좋은 예 (함수형 업데이트)
const handleIncrement = () => {
  setCount(prevCount => prevCount + 1);
};
```

#### 실수 3: 비동기에서 상태 수정

```js
// ❌ 위험한 코드
const handleMultipleClicks = () => {
  setTimeout(() => {
    setCount(count + 1); // 클로저로 인해 오래된 count 값 사용
  }, 1000);
  setTimeout(() => {
    setCount(count + 1); // 똑같은 오래된 count 값 사용
  }, 1000);
  // 1이 아니라 2가 증가할 것으로 예상하지만,
  // 실제로는 1만 증가함!
};

// ✅ 함수형 업데이트 사용
const handleMultipleClicks = () => {
  setTimeout(() => {
    setCount(prev => prev + 1); // 최신 값 사용
  }, 1000);
  setTimeout(() => {
    setCount(prev => prev + 1); // 최신 값 사용
  }, 1000);
  // 정확히 2가 증가!
};
```

### 5. 참조 공유로 인한 버그

```js
// ❌ 위험한 패턴
const defaultUser = {
  name: '',
  email: '',
  preferences: {
    theme: 'light'
  }
};

function UserForm() {
  const [user, setUser] = useState(defaultUser);

  const handleSubmit = () => {
    // ... 제출 로직
    setUser(defaultUser); // 위험! 같은 객체 참조
  };
}

// 여러 컴포넌트가 defaultUser를 공유하면?
// 한 곳에서 수정하면 다른 곳도 영향받음!

// ✅ 안전한 패턴
const getDefaultUser = () => ({
  name: '',
  email: '',
  preferences: {
    theme: 'light'
  }
});

function UserForm() {
  const [user, setUser] = useState(getDefaultUser());

  const handleSubmit = () => {
    // ... 제출 로직
    setUser(getDefaultUser()); // 항상 새 객체
  };
}
```

### 6. Object.assign()의 함정

```js
const obj1 = { a: 1, b: { c: 2 } };

// ❌ 얕은 복사만 됨
const obj2 = Object.assign({}, obj1);
obj2.b.c = 3;
console.log(obj1.b.c); // 3 - 원본 변경!

// ✅ 깊은 속성도 복사
const obj2 = {
  ...obj1,
  b: { ...obj1.b, c: 3 }
};
console.log(obj1.b.c); // 2 - 원본 유지
```

## 실전 활용: React에서의 패턴

### 1. useState와 불변성

```jsx
function ShoppingCart() {
  const [cart, setCart] = useState({
    items: [],
    total: 0,
    discount: null
  });

  // ✅ 아이템 추가
  const addItem = (product) => {
    setCart(prev => ({
      ...prev,
      items: [...prev.items, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }],
      total: prev.total + product.price
    }));
  };

  // ✅ 수량 변경
  const updateQuantity = (itemId, newQuantity) => {
    setCart(prev => {
      const item = prev.items.find(i => i.id === itemId);
      const priceDiff = item.price * (newQuantity - item.quantity);

      return {
        ...prev,
        items: prev.items.map(i =>
          i.id === itemId
            ? { ...i, quantity: newQuantity }
            : i
        ),
        total: prev.total + priceDiff
      };
    });
  };

  // ✅ 아이템 제거
  const removeItem = (itemId) => {
    setCart(prev => {
      const item = prev.items.find(i => i.id === itemId);

      return {
        ...prev,
        items: prev.items.filter(i => i.id !== itemId),
        total: prev.total - (item.price * item.quantity)
      };
    });
  };

  // ✅ 할인 적용
  const applyDiscount = (discountCode) => {
    setCart(prev => ({
      ...prev,
      discount: {
        code: discountCode,
        amount: prev.total * 0.1
      }
    }));
  };

  return (
    <div>
      <h2>장바구니</h2>
      {cart.items.map(item => (
        <div key={item.id}>
          <span>{item.name}</span>
          <span>{item.quantity}</span>
          <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
            +
          </button>
          <button onClick={() => removeItem(item.id)}>
            삭제
          </button>
        </div>
      ))}
      <div>합계: {cart.total}원</div>
    </div>
  );
}
```

### 2. useReducer와 불변성

복잡한 상태 로직은 reducer로 관리하면 더 깔끔합니다.

```jsx
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
        total: state.total + action.payload.price
      };

    case 'REMOVE_ITEM':
      const item = state.items.find(i => i.id === action.payload);
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.payload),
        total: state.total - (item.price * item.quantity)
      };

    case 'UPDATE_QUANTITY':
      const { itemId, quantity } = action.payload;
      const oldItem = state.items.find(i => i.id === itemId);
      const priceDiff = oldItem.price * (quantity - oldItem.quantity);

      return {
        ...state,
        items: state.items.map(i =>
          i.id === itemId ? { ...i, quantity } : i
        ),
        total: state.total + priceDiff
      };

    case 'APPLY_DISCOUNT':
      return {
        ...state,
        discount: {
          code: action.payload,
          amount: state.total * 0.1
        }
      };

    case 'CLEAR_CART':
      return {
        items: [],
        total: 0,
        discount: null
      };

    default:
      return state;
  }
};

function ShoppingCart() {
  const [cart, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    discount: null
  });

  return (
    <div>
      <button onClick={() => dispatch({
        type: 'ADD_ITEM',
        payload: { id: 1, name: '상품', price: 1000 }
      })}>
        추가
      </button>
      {/* ... */}
    </div>
  );
}
```

### 3. Redux와 불변성

Redux는 불변성이 필수입니다.

```js
// ❌ Mutation: 절대 안 됨!
const todosReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      state.push(action.payload); // 원본 수정!
      return state; // 같은 참조 반환
    default:
      return state;
  }
};

// ✅ Immutable: 올바른 방식
const todosReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_TODO':
      return [...state, action.payload]; // 새 배열 생성

    case 'REMOVE_TODO':
      return state.filter(todo => todo.id !== action.payload);

    case 'TOGGLE_TODO':
      return state.map(todo =>
        todo.id === action.payload
          ? { ...todo, done: !todo.done }
          : todo
      );

    case 'UPDATE_TODO':
      return state.map(todo =>
        todo.id === action.payload.id
          ? { ...todo, ...action.payload.updates }
          : todo
      );

    default:
      return state;
  }
};
```

### 4. Immer로 간단하게 만들기

복잡한 불변성 업데이트는 Immer를 사용하면 훨씬 간단해집니다.

```js
import { produce } from 'immer';

// ✅ Immer 없이 (복잡함)
const nextState = {
  ...state,
  users: state.users.map(user =>
    user.id === userId
      ? {
          ...user,
          profile: {
            ...user.profile,
            address: {
              ...user.profile.address,
              city: newCity
            }
          }
        }
      : user
  )
};

// ✅ Immer 사용 (간단함!)
const nextState = produce(state, draft => {
  const user = draft.users.find(u => u.id === userId);
  user.profile.address.city = newCity;
});

// React에서 사용
const updateCity = (userId, newCity) => {
  setState(produce(draft => {
    const user = draft.users.find(u => u.id === userId);
    user.profile.address.city = newCity;
  }));
};
```

**Immer의 장점:**
- 직접 수정하는 것처럼 직관적으로 코드 작성
- 내부적으로는 불변성을 완벽하게 지킴
- 깊은 중첩 구조도 쉽게 업데이트
- TypeScript와도 잘 동작

**Immer를 사용하는 Redux Toolkit:**

```js
import { createSlice } from '@reduxjs/toolkit';

const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    // Immer가 내장되어 있어서 직접 수정 가능!
    addTodo: (state, action) => {
      state.push(action.payload); // 이게 OK!
    },
    toggleTodo: (state, action) => {
      const todo = state.find(t => t.id === action.payload);
      todo.done = !todo.done; // 이것도 OK!
    },
    removeTodo: (state, action) => {
      return state.filter(t => t.id !== action.payload);
      // return을 쓰면 새 배열로 교체
    }
  }
});

// Redux Toolkit은 내부적으로 Immer를 사용하므로
// 직접 수정해도 실제로는 불변성이 지켜짐!
```

### 5. 성능 최적화와 불변성

#### React.memo와 참조 동등성

```jsx
// ❌ 매번 재렌더링됨
function Parent() {
  const [count, setCount] = useState(0);

  // 매번 새 객체 생성!
  const config = {
    theme: 'dark',
    size: 'medium'
  };

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
      <Child config={config} />
    </div>
  );
}

const Child = React.memo(({ config }) => {
  console.log('Child rendered');
  return <div>{config.theme}</div>;
});
// count가 바뀔 때마다 Child도 재렌더링됨!
// config이 매번 새 객체이기 때문

// ✅ 필요할 때만 재렌더링
function Parent() {
  const [count, setCount] = useState(0);

  // 같은 객체 유지
  const config = useMemo(() => ({
    theme: 'dark',
    size: 'medium'
  }), []); // 의존성 배열이 비어있으면 한 번만 생성

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
      <Child config={config} />
    </div>
  );
}

const Child = React.memo(({ config }) => {
  console.log('Child rendered');
  return <div>{config.theme}</div>;
});
// count가 바뀌어도 Child는 재렌더링되지 않음!
```

#### 객체/배열 props 최적화

```jsx
function TodoList() {
  const [todos, setTodos] = useState([...]);
  const [filter, setFilter] = useState('all');

  // ❌ 매번 새 배열 생성
  const filtered = todos.filter(todo => {
    if (filter === 'all') return true;
    if (filter === 'active') return !todo.done;
    if (filter === 'completed') return todo.done;
  });

  // filter나 todos가 바뀌지 않아도 매번 새 배열!

  return <TodoItems items={filtered} />;
}

// ✅ useMemo로 최적화
function TodoList() {
  const [todos, setTodos] = useState([...]);
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    return todos.filter(todo => {
      if (filter === 'all') return true;
      if (filter === 'active') return !todo.done;
      if (filter === 'completed') return todo.done;
    });
  }, [todos, filter]); // todos나 filter가 바뀔 때만 재계산

  return <TodoItems items={filtered} />;
}

const TodoItems = React.memo(({ items }) => {
  return items.map(item => <div key={item.id}>{item.text}</div>);
});
```

## 성능 고려사항

### 언제 Mutation을 써도 될까?

불변성이 항상 답은 아닙니다. 상황에 따라 Mutation이 더 나을 때도 있습니다.

#### 1. 지역 변수 (Local Variables)

```js
function processData(items) {
  // ✅ 지역 변수는 mutation 해도 OK
  const result = [];

  for (const item of items) {
    if (item.valid) {
      result.push(item.value * 2);
    }
  }

  return result; // 외부에서 참조되지 않으므로 안전
}

// 이것보다 더 효율적:
function processData(items) {
  return items
    .filter(item => item.valid)
    .map(item => item.value * 2);
  // filter와 map은 두 번 순회하고 중간 배열도 생성
}
```

#### 2. 성능이 중요한 대용량 데이터

```js
// 10만 개 항목을 처리할 때
function processLargeArray(arr) {
  // ❌ 느림: 여러 번 복사
  let result = [];
  for (let i = 0; i < 100000; i++) {
    result = [...result, arr[i] * 2]; // 매번 배열 복사!
  }
  return result;
}

// ✅ 빠름: 한 번만 할당
function processLargeArray(arr) {
  const result = [];
  for (let i = 0; i < 100000; i++) {
    result.push(arr[i] * 2);
  }
  return result;
}

// 또는 map 사용 (내부적으로 최적화됨)
function processLargeArray(arr) {
  return arr.map(x => x * 2);
}
```

#### 3. 알고리즘 구현

```js
// 퀵소트 같은 알고리즘은 in-place 수정이 효율적
function quickSort(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    const pivotIndex = partition(arr, left, right);
    quickSort(arr, left, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, right);
  }
  return arr;
}

function partition(arr, left, right) {
  const pivot = arr[right];
  let i = left - 1;

  for (let j = left; j < right; j++) {
    if (arr[j] < pivot) {
      i++;
      // swap (mutation)
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
  return i + 1;
}

// 사용
const numbers = [3, 1, 4, 1, 5, 9, 2, 6];
const sorted = quickSort([...numbers]); // 복사본으로 정렬
```

### 성능 측정하기

실제로 성능 차이가 얼마나 날까요?

```js
// 벤치마크 예제
const arr = Array.from({ length: 10000 }, (_, i) => i);

// Mutation 방식
console.time('mutation');
const result1 = [];
for (let i = 0; i < arr.length; i++) {
  result1.push(arr[i] * 2);
}
console.timeEnd('mutation');
// mutation: ~1ms

// Immutable 방식
console.time('immutable');
const result2 = arr.map(x => x * 2);
console.timeEnd('immutable');
// immutable: ~2ms

// 스프레드 방식 (매우 비효율적)
console.time('spread');
let result3 = [];
for (let i = 0; i < 1000; i++) { // 1000개만!
  result3 = [...result3, arr[i] * 2];
}
console.timeEnd('spread');
// spread: ~100ms (!!)
```

**결론:**
- 대부분의 경우 성능 차이는 미미합니다
- 불변성의 이점(예측 가능성, 디버깅 용이성)이 작은 성능 손실보다 큽니다
- 정말 성능이 중요한 부분만 최적화하세요
- 측정하지 않고 최적화하지 마세요 (Premature optimization is the root of all evil)

## 디버깅 팁

### 1. 불변성 위반 찾기

#### Redux DevTools 사용

```js
// 불변성을 위반하면 Redux DevTools에서 경고 표시
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: true,
      immutableCheck: true, // 불변성 체크 활성화
    }),
});
```

#### Immer의 freeze 모드

```js
import { produce, setAutoFreeze } from 'immer';

// 개발 환경에서 자동으로 freeze
setAutoFreeze(process.env.NODE_ENV === 'development');

const state = { count: 0 };
const nextState = produce(state, draft => {
  draft.count++;
});

// 개발 환경에서는 state가 freeze됨
state.count = 10; // Error: Cannot assign to read only property
```

#### ESLint 플러그인

```js
// .eslintrc.js
module.exports = {
  plugins: ['immutable'],
  rules: {
    'immutable/no-let': 'error',
    'immutable/no-this': 'error',
    'immutable/no-mutation': 'error',
  },
};
```

### 2. 상태 변화 추적

```jsx
function useTrackedState(initialState) {
  const [state, setState] = useState(initialState);
  const previousState = useRef(initialState);

  useEffect(() => {
    if (previousState.current !== state) {
      console.log('State changed:');
      console.log('Previous:', previousState.current);
      console.log('Current:', state);
      console.log('Same reference?', previousState.current === state);

      previousState.current = state;
    }
  }, [state]);

  return [state, setState];
}

// 사용
function App() {
  const [todos, setTodos] = useTrackedState([]);

  const addTodo = (text) => {
    // ❌ 이렇게 하면 로그에서 Same reference? true 표시
    todos.push({ text });
    setTodos(todos);

    // ✅ 이렇게 하면 Same reference? false 표시
    setTodos([...todos, { text }]);
  };
}
```

### 3. 얕은 복사 vs 깊은 복사 확인

```js
function checkCopyDepth(original, copy) {
  console.log('=== Copy Depth Check ===');

  // 최상위 레벨
  console.log('Top level same?', original === copy);

  // 1단계 깊이
  for (const key in original) {
    if (typeof original[key] === 'object' && original[key] !== null) {
      console.log(`${key} same?`, original[key] === copy[key]);
    }
  }
}

const original = {
  name: '홍길동',
  address: { city: '서울' }
};

const shallow = { ...original };
const deep = structuredClone(original);

checkCopyDepth(original, shallow);
// Top level same? false
// address same? true ← 얕은 복사!

checkCopyDepth(original, deep);
// Top level same? false
// address same? false ← 깊은 복사!
```

## 마무리: 실전 체크리스트

### React/Redux 프로젝트에서 반드시 지켜야 할 규칙

#### ✅ 항상 해야 할 것

1. **useState/useReducer에서는 항상 새 참조 생성**
   ```js
   setState([...oldArray, newItem]);
   setState({ ...oldObject, key: newValue });
   ```

2. **배열 메서드 선택**
   - Mutating: `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse` ❌
   - Non-Mutating: `concat`, `slice`, `map`, `filter`, `reduce` ✅

3. **객체 수정 시 스프레드 연산자 사용**
   ```js
   const updated = { ...original, modified: 'value' };
   ```

4. **중첩 구조는 모든 레벨 복사**
   ```js
   setState({
     ...state,
     nested: {
       ...state.nested,
       deep: newValue
     }
   });
   ```

#### ❌ 절대 하지 말아야 할 것

1. **props 직접 수정 금지**
   ```js
   // ❌ 절대 안 됨!
   props.data.value = 'new';
   ```

2. **state 직접 수정 금지**
   ```js
   // ❌ 절대 안 됨!
   this.state.count = 10;
   state.todos.push(newTodo);
   ```

3. **Redux state 직접 수정 금지**
   ```js
   // ❌ 절대 안 됨!
   state.items.sort();
   state.user.name = 'new name';
   ```

#### 🔧 도구 활용

1. **Immer 사용 (복잡한 업데이트)**
   ```bash
   npm install immer
   ```

2. **Redux Toolkit 사용 (Redux 프로젝트)**
   ```bash
   npm install @reduxjs/toolkit
   ```

3. **TypeScript 활용 (타입 안정성)**
   ```typescript
   // Readonly로 불변성 강제
   type State = Readonly<{
     count: number;
     items: ReadonlyArray<Item>;
   }>;
   ```

### 학습 로드맵

1. **기초 다지기**
   - 참조 vs 값의 차이 완벽히 이해
   - 얕은 복사 vs 깊은 복사 구분
   - 기본 배열/객체 메서드 익히기

2. **React 패턴 익히기**
   - useState에서 불변성 유지
   - useReducer로 복잡한 상태 관리
   - 성능 최적화 (React.memo, useMemo)

3. **고급 기법**
   - Immer로 간단하게 불변성 유지
   - Redux Toolkit 활용
   - 대규모 앱에서의 상태 관리 패턴

4. **실전 프로젝트**
   - Todo 앱 만들기
   - Shopping Cart 구현
   - 복잡한 폼 관리

기억하세요: **불변성은 처음에는 불편하지만, 익숙해지면 버그를 크게 줄이고 디버깅을 훨씬 쉽게 만들어줍니다!**

## 참고 자료

### 공식 문서

- [MDN - Array Methods](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Array) - JavaScript 배열 메서드 완벽 가이드
- [MDN - Object Methods](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object) - 객체 메서드 레퍼런스
- [MDN - Spread Syntax](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/Spread_syntax) - 스프레드 연산자 문법
- [MDN - structuredClone()](https://developer.mozilla.org/en-US/docs/Web/API/structuredClone) - 깊은 복사 API

### React 관련

- [React Docs - Updating Objects in State](https://react.dev/learn/updating-objects-in-state) - React 공식 불변성 가이드
- [React Docs - Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state) - 배열 상태 업데이트 가이드
- [React Docs - useReducer](https://react.dev/reference/react/useReducer) - useReducer 공식 문서
- [React DevTools](https://react.dev/learn/react-developer-tools) - React 디버깅 도구

### Redux 관련

- [Redux - Immutable Update Patterns](https://redux.js.org/usage/structuring-reducers/immutable-update-patterns) - Redux 불변성 패턴
- [Redux Toolkit](https://redux-toolkit.js.org/) - 현대적인 Redux 사용법
- [Redux DevTools](https://github.com/reduxjs/redux-devtools) - Redux 디버깅 도구

### 불변성 라이브러리

- [Immer](https://immerjs.github.io/immer/) - 불변성을 쉽게 다루는 라이브러리
- [Immutable.js](https://immutable-js.com/) - Facebook의 불변 데이터 구조
- [Lodash](https://lodash.com/docs/) - cloneDeep 등 유틸리티 함수

### 함수형 프로그래밍

- [Professor Frisby's Mostly Adequate Guide](https://mostly-adequate.gitbook.io/mostly-adequate-guide/) - 함수형 프로그래밍 입문서
- [Ramda](https://ramdajs.com/) - 함수형 프로그래밍 라이브러리
- [Functional Programming in JavaScript](https://www.youtube.com/watch?v=BMUiFMZr7vk) - Fun Fun Function 비디오 시리즈

### 성능 최적화

- [JavaScript Performance](https://web.dev/articles/optimize-javascript-execution) - Google Web.dev 성능 가이드
- [React Performance Optimization](https://react.dev/learn/render-and-commit) - React 렌더링 최적화
- [Why did you render?](https://github.com/welldone-software/why-did-you-render) - 불필요한 리렌더링 찾기

### 학습 자료

- [JavaScript.info - Data Types](https://javascript.info/data-types) - JavaScript 데이터 타입 심화
- [You Don't Know JS - Types & Grammar](https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/types%20&%20grammar/README.md) - JavaScript 타입 시스템
- [Eloquent JavaScript](https://eloquentjavascript.net/) - JavaScript 프로그래밍 완전 정복

### 블로그 및 아티클

- [Handling State in React: Four Immutable Approaches](https://medium.com/@housecor/handling-state-in-react-four-immutable-approaches-to-consider-d1f5c00249d5) - React 불변성 접근법
- [Immutability in JavaScript](https://www.sitepoint.com/immutability-javascript/) - 불변성 개념 설명
- [Understanding Immutability in JavaScript](https://css-tricks.com/understanding-immutability-in-javascript/) - CSS-Tricks 가이드
- [The Dao of Immutability](https://medium.com/javascript-scene/the-dao-of-immutability-9f91a70c88cd) - Eric Elliott의 불변성 철학

### 도구 및 린팅

- [ESLint Plugin Immutable](https://github.com/jhusain/eslint-plugin-immutable) - 불변성 강제하는 ESLint 플러그인
- [TypeScript Readonly](https://www.typescriptlang.org/docs/handbook/utility-types.html#readonlytype) - TypeScript로 불변성 강제
- [Object.freeze()](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) - 객체 동결

### 비디오 강의

- [JavaScript Immutability](https://egghead.io/courses/javascript-immutability) - Egghead.io 강의
- [Redux and Immutable.js](https://www.youtube.com/watch?v=I7IdS-PbEgI) - Dan Abramov의 Redux 강의
- [Fun Fun Function - Immutability](https://www.youtube.com/watch?v=4LzcQyZ9JOU) - 재미있는 불변성 설명
