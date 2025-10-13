---
title: Callback - JavaScript 비동기의 시작점
date: 2025-10-13
layout: page
---

# Callback - JavaScript 비동기의 시작점

이런 코드를 본 적이 있나요?

```javascript
button.addEventListener('click', function() {
  console.log('버튼이 클릭되었습니다!');
});
```

"어떻게 버튼을 클릭하면 이 함수가 실행되는 거지?" 처음 JavaScript를 배울 때 이런 의문을 가져본 적이 있을 겁니다. 저도 마찬가지였습니다. 처음에는 그냥 "이렇게 쓰면 된다"고만 외웠죠.

하지만 실제 프로젝트에서 API 호출, 타이머, 이벤트 처리 등을 다루다 보면 callback이 JavaScript의 **비동기 프로그래밍의 근간**이라는 것을 깨닫게 됩니다. Promise나 async/await도 결국 callback의 복잡함을 해결하기 위해 등장한 것이고, callback을 이해하지 못하면 이들도 완전히 이해할 수 없습니다.

이 문서에서는 callback이 무엇인지, 왜 필요한지, 그리고 실제로 어떻게 활용하는지를 처음부터 끝까지 자세히 설명하겠습니다.

## 목차

- [왜 Callback을 이해해야 할까요?](#왜-callback을-이해해야-할까요)
- [먼저, 문제 상황을 보면서 시작해볼까요?](#먼저-문제-상황을-보면서-시작해볼까요)
- [Callback이란 무엇인가?](#callback이란-무엇인가)
- [Callback은 어떻게 작동할까요?](#callback은-어떻게-작동할까요)
- [실전 예제로 배우는 Callback](#실전-예제로-배우는-callback)
- [Callback의 실행 흐름 이해하기](#callback의-실행-흐름-이해하기)
- [함정과 주의사항](#함정과-주의사항)
- [실전에서 활용하기](#실전에서-활용하기)
- [Callback vs Promise vs Async/Await](#callback-vs-promise-vs-asyncawait)
- [결론: Callback을 언제 어떻게 사용할까?](#결론-callback을-언제-어떻게-사용할까)
- [참고 자료](#참고-자료)

## 왜 Callback을 이해해야 할까요?

### 1. JavaScript는 비동기 언어입니다

JavaScript는 **단일 스레드(Single Thread)** 언어입니다. 즉, 한 번에 하나의 작업만 처리할 수 있습니다. 그런데 웹 애플리케이션은 이런 작업들을 동시에 처리해야 합니다:

- 사용자가 버튼을 클릭하는 것을 기다리기
- 서버에서 데이터를 가져오기
- 파일을 읽고 쓰기
- 타이머가 끝나기를 기다리기

만약 이런 작업들을 순차적으로만 처리한다면?

```javascript
// 만약 JavaScript가 동기적으로만 작동한다면...
const data = fetchDataFromServer(); // 3초 걸림
// 3초 동안 화면이 멈춤! 사용자는 아무것도 할 수 없음!
console.log(data);
```

**Callback은 이 문제를 해결합니다.** "작업이 끝나면 이 함수를 호출해줘"라고 요청하면, JavaScript는 그동안 다른 일을 할 수 있습니다.

### 2. 모든 비동기 API의 기초입니다

Promise와 async/await이 등장하기 전까지, 그리고 지금도 많은 API들이 callback을 사용합니다:

```javascript
// 이벤트 리스너
document.addEventListener('click', callback);

// 타이머
setTimeout(callback, 1000);

// Node.js 파일 읽기
fs.readFile('file.txt', callback);

// HTTP 요청 (Express.js)
app.get('/api/users', (req, res) => {
  // callback!
});
```

Callback을 모르면 이런 API들을 사용할 수 없습니다.

### 3. 디버깅과 에러 처리에 필수입니다

실무에서 이런 버그를 본 적이 있나요?

```javascript
let userData;

fetchUser(userId, function(user) {
  userData = user;
});

console.log(userData); // undefined ⚠️
// 왜 undefined일까요?
```

Callback의 실행 타이밍을 이해하지 못하면 이런 버그를 만들게 됩니다.

### 4. 고차 함수(Higher-Order Functions)를 이해하는 핵심입니다

JavaScript의 강력한 배열 메소드들도 모두 callback을 사용합니다:

```javascript
const numbers = [1, 2, 3, 4, 5];

// map, filter, reduce 등 모두 callback을 인자로 받습니다
const doubled = numbers.map(num => num * 2);
const evens = numbers.filter(num => num % 2 === 0);
const sum = numbers.reduce((acc, num) => acc + num, 0);
```

Callback을 이해하면 함수형 프로그래밍의 세계가 열립니다.

## 먼저, 문제 상황을 보면서 시작해볼까요?

커피숍에서 주문하는 상황을 코드로 표현해보겠습니다.

### 접근 1: 동기적 방식 (막힘 발생)

```javascript
function orderCoffee() {
  console.log('커피를 주문합니다');

  // 커피 제조 시간: 5초
  const startTime = Date.now();
  while (Date.now() - startTime < 5000) {
    // 5초 동안 아무것도 못함 (Blocking!)
  }

  console.log('커피가 준비되었습니다');
  return '☕ 아메리카노';
}

function greetCustomer() {
  console.log('어서오세요!');
}

console.log('=== 커피숍 영업 시작 ===');
const coffee = orderCoffee();
console.log(`받은 커피: ${coffee}`);
greetCustomer();
console.log('=== 영업 종료 ===');

// 출력:
// === 커피숍 영업 시작 ===
// 커피를 주문합니다
// (5초 대기... 화면이 멈춤!)
// 커피가 준비되었습니다
// 받은 커피: ☕ 아메리카노
// 어서오세요!
// === 영업 종료 ===
```

**문제점:**
- 커피를 만드는 동안 **아무것도 할 수 없습니다**
- 다른 손님을 맞이할 수도 없습니다
- 브라우저 화면이 멈춥니다 (UI Freeze)

실제로 웹사이트에서 이렇게 작동하면 사용자는 버튼을 눌러도 반응이 없어서 답답해합니다!

### 접근 2: Callback을 사용한 비동기 방식 ⭐

```javascript
function orderCoffee(callback) {
  console.log('커피를 주문합니다');

  // 비동기로 커피 제조 (실제로는 setTimeout 사용)
  setTimeout(function() {
    console.log('커피가 준비되었습니다');
    const coffee = '☕ 아메리카노';
    callback(coffee); // 준비되면 callback 호출!
  }, 5000);

  console.log('커피 제조 중... 다른 일을 할 수 있어요!');
}

function greetCustomer() {
  console.log('어서오세요!');
}

console.log('=== 커피숍 영업 시작 ===');

orderCoffee(function(coffee) {
  console.log(`받은 커피: ${coffee}`);
});

greetCustomer(); // 커피 기다리는 동안 손님 맞이!
console.log('주문서를 정리합니다');

console.log('=== 영업 종료 ===');

// 출력:
// === 커피숍 영업 시작 ===
// 커피를 주문합니다
// 커피 제조 중... 다른 일을 할 수 있어요!
// 어서오세요!
// 주문서를 정리합니다
// === 영업 종료 ===
// (5초 후)
// 커피가 준비되었습니다
// 받은 커피: ☕ 아메리카노
```

**해결된 점:**
- ✅ 커피 제조 중에도 다른 일을 할 수 있습니다
- ✅ 화면이 멈추지 않습니다
- ✅ 커피가 준비되면 자동으로 callback이 호출됩니다

이것이 바로 Callback의 힘입니다!

### 실행 흐름 시각화

```
시간 →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

0초: orderCoffee() 호출
     ├─ "커피를 주문합니다" 출력
     ├─ setTimeout 등록 (5초 후 실행 예약)
     └─ "커피 제조 중..." 출력

0.1초: greetCustomer() 호출
       └─ "어서오세요!" 출력

0.2초: "주문서를 정리합니다" 출력

0.3초: "=== 영업 종료 ===" 출력

1초: (아직 커피 제조 중...)
2초: (아직 커피 제조 중...)
3초: (아직 커피 제조 중...)
4초: (아직 커피 제조 중...)

5초: setTimeout의 callback 실행!
     ├─ "커피가 준비되었습니다" 출력
     └─ callback(coffee) 호출
         └─ "받은 커피: ☕ 아메리카노" 출력
```

## Callback이란 무엇인가?

### 기본 개념

**Callback은 다른 함수에 인자로 전달되는 함수입니다.** 그리고 특정 시점에 "나중에" 호출됩니다.

```javascript
// 이것이 callback 함수입니다
function sayHello() {
  console.log('안녕하세요!');
}

// sayHello를 인자로 전달합니다
setTimeout(sayHello, 1000);
```

더 간단하게 익명 함수로도 쓸 수 있습니다:

```javascript
setTimeout(function() {
  console.log('안녕하세요!');
}, 1000);

// 또는 화살표 함수로
setTimeout(() => {
  console.log('안녕하세요!');
}, 1000);
```

### Callback의 두 가지 유형

#### 1. 동기적 Callback (Synchronous Callback)

**즉시 실행**되는 callback입니다.

```javascript
// 배열의 map, filter, forEach 등
const numbers = [1, 2, 3, 4, 5];

numbers.forEach(function(num) {
  console.log(num); // 즉시 실행됨
});

console.log('끝!');

// 출력:
// 1
// 2
// 3
// 4
// 5
// 끝!
```

**특징:**
- 함수가 반환되기 전에 callback이 실행됩니다
- 실행 순서가 예측 가능합니다
- 코드 흐름이 직관적입니다

#### 2. 비동기적 Callback (Asynchronous Callback)

**나중에** 실행되는 callback입니다.

```javascript
console.log('시작');

setTimeout(function() {
  console.log('1초 후'); // 나중에 실행됨
}, 1000);

console.log('끝');

// 출력:
// 시작
// 끝
// (1초 후)
// 1초 후
```

**특징:**
- 함수가 반환된 후에 callback이 실행됩니다
- 실행 순서를 예측하기 어려울 수 있습니다
- 이벤트 루프(Event Loop)에 의해 관리됩니다

### First-Class Functions (일급 함수)

JavaScript에서 callback이 가능한 이유는 함수가 **일급 객체(First-Class Object)**이기 때문입니다.

```javascript
// 1. 함수를 변수에 할당할 수 있습니다
const greet = function() {
  console.log('안녕하세요!');
};

// 2. 함수를 인자로 전달할 수 있습니다
function executeCallback(callback) {
  callback();
}

executeCallback(greet); // "안녕하세요!"

// 3. 함수를 반환할 수 있습니다
function makeGreeter(name) {
  return function() {
    console.log(`안녕하세요, ${name}님!`);
  };
}

const greetJohn = makeGreeter('John');
greetJohn(); // "안녕하세요, John님!"

// 4. 함수를 데이터 구조에 저장할 수 있습니다
const callbacks = [
  function() { console.log('첫 번째'); },
  function() { console.log('두 번째'); },
  function() { console.log('세 번째'); }
];

callbacks.forEach(cb => cb());
```

## Callback은 어떻게 작동할까요?

### 기본 구조

Callback을 사용하는 함수의 전형적인 구조입니다:

```javascript
function doSomethingAsync(param, callback) {
  // 1. 비동기 작업 시작
  setTimeout(function() {
    // 2. 작업 수행
    const result = param * 2;

    // 3. 작업 완료 후 callback 호출
    callback(result);
  }, 1000);
}

// 사용
doSomethingAsync(5, function(result) {
  console.log(`결과: ${result}`); // "결과: 10"
});
```

### 실행 컨텍스트와 스택

JavaScript는 **콜 스택(Call Stack)**을 사용해 함수 실행을 관리합니다.

```javascript
function first() {
  console.log('first 시작');
  second();
  console.log('first 끝');
}

function second() {
  console.log('second 시작');
  console.log('second 끝');
}

first();

// 출력:
// first 시작
// second 시작
// second 끝
// first 끝
```

**콜 스택의 변화:**

```
1단계:                2단계:              3단계:              4단계:
┌─────────┐          ┌─────────┐        ┌─────────┐        ┌─────────┐
│         │          │ second  │        │         │        │         │
├─────────┤          ├─────────┤        ├─────────┤        ├─────────┤
│ first   │    →     │ first   │   →    │ first   │   →    │         │
├─────────┤          ├─────────┤        ├─────────┤        ├─────────┤
│ (global)│          │ (global)│        │ (global)│        │ (global)│
└─────────┘          └─────────┘        └─────────┘        └─────────┘

first() 호출      second() 호출    second() 반환    first() 반환
```

### 비동기 Callback과 이벤트 루프

비동기 callback은 **이벤트 루프(Event Loop)**와 **태스크 큐(Task Queue)**를 통해 실행됩니다.

```javascript
console.log('1');

setTimeout(function callback() {
  console.log('2');
}, 0); // 0초 후에 실행!

console.log('3');

// 출력:
// 1
// 3
// 2  (왜 마지막일까요?)
```

**실행 흐름:**

```
1. 콜 스택에서 코드 실행
   ┌────────────────┐
   │ console.log('1')│
   └────────────────┘
   출력: "1"

2. setTimeout 호출
   ┌────────────────┐
   │ setTimeout(...) │  →  callback을 Web API에 등록
   └────────────────┘

   Web API:
   ┌─────────────────┐
   │ Timer (0ms)     │
   │  └─ callback()  │
   └─────────────────┘

3. 콜 스택 계속 실행
   ┌────────────────┐
   │ console.log('3')│
   └────────────────┘
   출력: "3"

4. 콜 스택 비었음! Timer 만료!
   ┌─────────────────┐
   │ Task Queue      │
   │  [callback()]   │
   └─────────────────┘
          ↓
   ┌─────────────────┐
   │ Call Stack      │
   │  callback()     │
   └─────────────────┘
   출력: "2"
```

**핵심 원칙:**
- JavaScript는 콜 스택이 **완전히 비어있을 때만** 태스크 큐에서 다음 작업을 가져옵니다
- 따라서 `setTimeout(callback, 0)`도 현재 코드가 모두 실행된 후에 실행됩니다

### Callback의 인자 전달

Callback에는 여러 인자를 전달할 수 있습니다:

```javascript
function fetchUserData(userId, callback) {
  // 서버 API 호출 시뮬레이션
  setTimeout(function() {
    const users = {
      1: { name: '홍길동', age: 30 },
      2: { name: '김철수', age: 25 }
    };

    const user = users[userId];

    if (user) {
      // 성공: (에러 없음, 데이터)
      callback(null, user);
    } else {
      // 실패: (에러, 데이터 없음)
      callback(new Error('사용자를 찾을 수 없습니다'), null);
    }
  }, 1000);
}

// 사용: Error-First Callback 패턴
fetchUserData(1, function(error, user) {
  if (error) {
    console.error('에러 발생:', error.message);
    return;
  }

  console.log('사용자 정보:', user);
});
```

## 실전 예제로 배우는 Callback

### 예제 1: 이벤트 리스너

가장 흔하게 접하는 callback입니다.

```javascript
// HTML:
// <button id="myButton">클릭하세요</button>

const button = document.getElementById('myButton');

// callback 함수 정의
function handleClick(event) {
  console.log('버튼이 클릭되었습니다!');
  console.log('클릭 위치:', event.clientX, event.clientY);
}

// callback 등록
button.addEventListener('click', handleClick);

// 또는 익명 함수로
button.addEventListener('click', function(event) {
  console.log('익명 함수 버전');
});

// 화살표 함수로
button.addEventListener('click', (event) => {
  console.log('화살표 함수 버전');
});
```

**실행 흐름:**

```
사용자 액션               JavaScript 엔진
     │
     │ 버튼 클릭
     │
     ↓
   Browser
     │
     │ Click Event 발생
     │
     ↓
  Event Queue
     │
     │ handleClick을 Task Queue에 추가
     │
     ↓
  Call Stack 비었는지 확인
     │
     ↓
  handleClick(event) 실행
     │
     ↓
   "버튼이 클릭되었습니다!" 출력
```

### 예제 2: setTimeout과 setInterval

타이머 기반 비동기 작업입니다.

```javascript
// setTimeout: 한 번 실행
console.log('시작');

setTimeout(function() {
  console.log('2초 후에 실행됩니다');
}, 2000);

console.log('끝');

// 출력:
// 시작
// 끝
// (2초 후)
// 2초 후에 실행됩니다
```

```javascript
// setInterval: 반복 실행
let count = 0;

const intervalId = setInterval(function() {
  count++;
  console.log(`${count}초 경과`);

  if (count === 5) {
    console.log('타이머 종료!');
    clearInterval(intervalId); // 타이머 중지
  }
}, 1000);

// 출력:
// 1초 경과
// 2초 경과
// 3초 경과
// 4초 경과
// 5초 경과
// 타이머 종료!
```

**실용적인 예: 자동 저장 기능**

```javascript
function autoSave(getData, interval) {
  return setInterval(function() {
    const data = getData();

    // 서버에 자동 저장
    saveToServer(data, function(error) {
      if (error) {
        console.error('자동 저장 실패:', error);
      } else {
        console.log('자동 저장 완료:', new Date().toLocaleTimeString());
      }
    });
  }, interval);
}

// 30초마다 자동 저장
const autoSaveId = autoSave(
  () => document.getElementById('editor').value,
  30000
);

// 페이지 떠날 때 자동 저장 중지
window.addEventListener('beforeunload', function() {
  clearInterval(autoSaveId);
});
```

### 예제 3: 배열 메소드 (고차 함수)

JavaScript 배열 메소드들은 callback을 적극 활용합니다.

#### map - 변환

```javascript
const numbers = [1, 2, 3, 4, 5];

// 각 요소를 2배로
const doubled = numbers.map(function(num) {
  return num * 2;
});

console.log(doubled); // [2, 4, 6, 8, 10]

// 화살표 함수로 더 간결하게
const tripled = numbers.map(num => num * 3);
console.log(tripled); // [3, 6, 9, 12, 15]
```

#### filter - 필터링

```javascript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 짝수만 필터링
const evens = numbers.filter(function(num) {
  return num % 2 === 0;
});

console.log(evens); // [2, 4, 6, 8, 10]

// 5보다 큰 수
const greaterThanFive = numbers.filter(num => num > 5);
console.log(greaterThanFive); // [6, 7, 8, 9, 10]
```

#### reduce - 축약

```javascript
const numbers = [1, 2, 3, 4, 5];

// 모든 수의 합
const sum = numbers.reduce(function(accumulator, current) {
  return accumulator + current;
}, 0);

console.log(sum); // 15

// 최댓값 찾기
const max = numbers.reduce((max, current) => {
  return current > max ? current : max;
}, numbers[0]);

console.log(max); // 5
```

#### 실용적인 예: 데이터 가공 파이프라인

```javascript
const users = [
  { name: '홍길동', age: 25, active: true },
  { name: '김철수', age: 30, active: false },
  { name: '이영희', age: 28, active: true },
  { name: '박민수', age: 35, active: true },
  { name: '정수진', age: 22, active: false }
];

// 활성 사용자 중 25세 이상인 사람의 이름만 추출
const activeAdultNames = users
  .filter(user => user.active)           // 활성 사용자만
  .filter(user => user.age >= 25)        // 25세 이상
  .map(user => user.name)                // 이름만 추출
  .sort();                                // 정렬

console.log(activeAdultNames); // ['박민수', '이영희', '홍길동']
```

### 예제 4: AJAX 요청 (Callback 스타일)

서버와 통신할 때 callback을 사용합니다.

```javascript
function fetchUser(userId, callback) {
  const xhr = new XMLHttpRequest();

  xhr.open('GET', `https://api.example.com/users/${userId}`);

  xhr.onload = function() {
    if (xhr.status === 200) {
      const user = JSON.parse(xhr.responseText);
      callback(null, user); // 성공
    } else {
      callback(new Error('사용자를 불러올 수 없습니다'), null); // 실패
    }
  };

  xhr.onerror = function() {
    callback(new Error('네트워크 에러'), null);
  };

  xhr.send();
}

// 사용
fetchUser(123, function(error, user) {
  if (error) {
    console.error('에러:', error.message);
    return;
  }

  console.log('사용자 정보:', user);
});
```

**실용적인 예: 여러 요청 순차 처리**

```javascript
// 사용자 정보 가져오기 → 게시글 가져오기 → 댓글 가져오기
fetchUser(123, function(error, user) {
  if (error) {
    console.error('사용자 로드 실패:', error);
    return;
  }

  console.log('사용자:', user.name);

  fetchPosts(user.id, function(error, posts) {
    if (error) {
      console.error('게시글 로드 실패:', error);
      return;
    }

    console.log(`게시글 ${posts.length}개`);

    fetchComments(posts[0].id, function(error, comments) {
      if (error) {
        console.error('댓글 로드 실패:', error);
        return;
      }

      console.log(`댓글 ${comments.length}개`);
    });
  });
});
```

이것이 바로 악명 높은 **Callback Hell**의 시작입니다! (나중에 자세히 다룹니다)

### 예제 5: Node.js 파일 시스템

Node.js에서 파일을 읽고 쓸 때도 callback을 사용합니다.

```javascript
const fs = require('fs');

// 파일 읽기
fs.readFile('data.txt', 'utf8', function(error, data) {
  if (error) {
    console.error('파일 읽기 실패:', error);
    return;
  }

  console.log('파일 내용:', data);
});

// 파일 쓰기
fs.writeFile('output.txt', '새로운 내용', function(error) {
  if (error) {
    console.error('파일 쓰기 실패:', error);
    return;
  }

  console.log('파일 쓰기 완료!');
});
```

**실용적인 예: 파일 복사**

```javascript
function copyFile(source, destination, callback) {
  fs.readFile(source, function(error, data) {
    if (error) {
      callback(error);
      return;
    }

    fs.writeFile(destination, data, function(error) {
      if (error) {
        callback(error);
        return;
      }

      callback(null, `${source} → ${destination} 복사 완료`);
    });
  });
}

// 사용
copyFile('input.txt', 'output.txt', function(error, message) {
  if (error) {
    console.error('복사 실패:', error);
  } else {
    console.log(message);
  }
});
```

### 예제 6: 커스텀 비동기 함수 만들기

자신만의 비동기 함수를 만들어봅시다.

```javascript
function delayedGreeting(name, delay, callback) {
  console.log(`${name}님을 위한 인사를 준비 중...`);

  setTimeout(function() {
    const greeting = `안녕하세요, ${name}님! 좋은 하루 되세요!`;
    callback(greeting);
  }, delay);
}

// 사용
delayedGreeting('홍길동', 2000, function(message) {
  console.log(message);
});

// 출력:
// 홍길동님을 위한 인사를 준비 중...
// (2초 후)
// 안녕하세요, 홍길동님! 좋은 하루 되세요!
```

**실용적인 예: 재시도 로직**

```javascript
function fetchWithRetry(url, maxRetries, callback) {
  let attempts = 0;

  function attempt() {
    attempts++;
    console.log(`시도 ${attempts}/${maxRetries}...`);

    fetch(url)
      .then(response => response.json())
      .then(data => callback(null, data))
      .catch(error => {
        if (attempts < maxRetries) {
          console.log('실패, 재시도 중...');
          setTimeout(attempt, 1000 * attempts); // 점진적 지연
        } else {
          callback(new Error(`${maxRetries}번 시도 후 실패: ${error.message}`));
        }
      });
  }

  attempt();
}

// 사용
fetchWithRetry('https://api.example.com/data', 3, function(error, data) {
  if (error) {
    console.error('최종 실패:', error.message);
  } else {
    console.log('성공:', data);
  }
});
```

## Callback의 실행 흐름 이해하기

### 동기 vs 비동기 시각화

```javascript
console.log('A');

setTimeout(() => console.log('B'), 0);

Promise.resolve().then(() => console.log('C'));

console.log('D');

// 출력: A D C B
```

**왜 이런 순서일까요?**

```
실행 순서 분석:

1. Call Stack
   ┌──────────────┐
   │console.log('A')│  → 출력: A
   └──────────────┘

2. setTimeout
   ┌──────────────┐
   │setTimeout(...) │  → Task Queue에 등록
   └──────────────┘

   Task Queue (Macro):
   [() => console.log('B')]

3. Promise
   ┌──────────────┐
   │Promise.then(...)│  → Microtask Queue에 등록
   └──────────────┘

   Microtask Queue:
   [() => console.log('C')]

4. Call Stack
   ┌──────────────┐
   │console.log('D')│  → 출력: D
   └──────────────┘

5. Call Stack 비었음!
   → Microtask Queue 먼저 실행!
   ┌──────────────┐
   │console.log('C')│  → 출력: C
   └──────────────┘

6. Microtask Queue 비었음!
   → Task Queue 실행!
   ┌──────────────┐
   │console.log('B')│  → 출력: B
   └──────────────┘
```

**우선순위:**
1. 동기 코드 (Call Stack)
2. Microtasks (Promise.then, queueMicrotask)
3. Macrotasks (setTimeout, setInterval, I/O)

### 복잡한 실행 흐름 예제

```javascript
function processData(callback) {
  console.log('1: 데이터 처리 시작');

  setTimeout(function() {
    console.log('2: 비동기 작업 완료');
    callback('결과 데이터');
  }, 1000);

  console.log('3: 데이터 처리 함수 종료');
}

console.log('0: 프로그램 시작');

processData(function(data) {
  console.log('4: Callback 실행, 데이터:', data);
});

console.log('5: 메인 코드 끝');

// 출력:
// 0: 프로그램 시작
// 1: 데이터 처리 시작
// 3: 데이터 처리 함수 종료
// 5: 메인 코드 끝
// (1초 후)
// 2: 비동기 작업 완료
// 4: Callback 실행, 데이터: 결과 데이터
```

**타임라인 시각화:**

```
시간 →
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

0ms:   "0: 프로그램 시작"
       ↓
10ms:  processData() 호출
       ├─ "1: 데이터 처리 시작"
       ├─ setTimeout 등록 (1000ms 후)
       └─ "3: 데이터 처리 함수 종료"
       ↓
20ms:  "5: 메인 코드 끝"
       ↓
       [Call Stack 비었음, 다른 작업 가능]
       ↓
1010ms: setTimeout callback 실행
        ├─ "2: 비동기 작업 완료"
        └─ callback('결과 데이터')
            └─ "4: Callback 실행, 데이터: 결과 데이터"
```

## 함정과 주의사항

### 함정 1: Callback Hell (콜백 지옥)

가장 악명 높은 문제입니다.

```javascript
// ❌ Callback Hell의 전형적인 예
getUser(userId, function(error, user) {
  if (error) {
    handleError(error);
  } else {
    getProfile(user.id, function(error, profile) {
      if (error) {
        handleError(error);
      } else {
        getPosts(profile.id, function(error, posts) {
          if (error) {
            handleError(error);
          } else {
            getComments(posts[0].id, function(error, comments) {
              if (error) {
                handleError(error);
              } else {
                displayData(user, profile, posts, comments);
              }
            });
          }
        });
      }
    });
  }
});
```

**문제점:**
- 🚫 코드가 오른쪽으로 계속 들여쓰기됨 (Pyramid of Doom)
- 🚫 읽기 어렵고 유지보수하기 힘듦
- 🚫 에러 처리가 반복됨
- 🚫 디버깅이 어려움

**해결책 1: 함수 분리**

```javascript
// ✅ 함수를 분리해서 평평하게 만들기
function handleUser(error, user) {
  if (error) {
    handleError(error);
    return;
  }
  getProfile(user.id, handleProfile);
}

function handleProfile(error, profile) {
  if (error) {
    handleError(error);
    return;
  }
  getPosts(profile.id, handlePosts);
}

function handlePosts(error, posts) {
  if (error) {
    handleError(error);
    return;
  }
  getComments(posts[0].id, handleComments);
}

function handleComments(error, comments) {
  if (error) {
    handleError(error);
    return;
  }
  displayData(comments);
}

// 시작
getUser(userId, handleUser);
```

**해결책 2: Promise 사용**

```javascript
// ✅ Promise로 평평하게 만들기
getUser(userId)
  .then(user => getProfile(user.id))
  .then(profile => getPosts(profile.id))
  .then(posts => getComments(posts[0].id))
  .then(comments => displayData(comments))
  .catch(error => handleError(error));
```

**해결책 3: async/await 사용**

```javascript
// ✅ async/await으로 동기 코드처럼 작성
async function loadUserData(userId) {
  try {
    const user = await getUser(userId);
    const profile = await getProfile(user.id);
    const posts = await getPosts(profile.id);
    const comments = await getComments(posts[0].id);
    displayData(user, profile, posts, comments);
  } catch (error) {
    handleError(error);
  }
}

loadUserData(userId);
```

### 함정 2: this 바인딩 문제

Callback에서 `this`는 예상과 다를 수 있습니다.

```javascript
const counter = {
  count: 0,

  start: function() {
    // ❌ 문제: setTimeout의 callback에서 this는 window!
    setTimeout(function() {
      this.count++;
      console.log(this.count); // NaN (window.count는 undefined)
    }, 1000);
  }
};

counter.start();
```

**해결책 1: 화살표 함수 사용**

```javascript
const counter = {
  count: 0,

  start: function() {
    // ✅ 화살표 함수는 외부의 this를 유지
    setTimeout(() => {
      this.count++;
      console.log(this.count); // 1
    }, 1000);
  }
};

counter.start();
```

**해결책 2: bind 사용**

```javascript
const counter = {
  count: 0,

  start: function() {
    // ✅ bind로 this를 고정
    setTimeout(function() {
      this.count++;
      console.log(this.count);
    }.bind(this), 1000);
  }
};

counter.start();
```

**해결책 3: 변수에 저장**

```javascript
const counter = {
  count: 0,

  start: function() {
    // ✅ this를 변수에 저장
    const self = this;
    setTimeout(function() {
      self.count++;
      console.log(self.count);
    }, 1000);
  }
};

counter.start();
```

### 함정 3: 에러 처리 누락

비동기 callback에서 에러를 처리하지 않으면 조용히 실패합니다.

```javascript
// ❌ 에러 처리 없음
function fetchData(url, callback) {
  fetch(url)
    .then(response => response.json())
    .then(data => callback(data));
  // 에러가 발생하면? 아무도 모름!
}

// ✅ 에러 처리 포함
function fetchData(url, callback) {
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(data => callback(null, data))
    .catch(error => callback(error, null));
}

// 사용 시 항상 에러 체크
fetchData('https://api.example.com/data', function(error, data) {
  if (error) {
    console.error('에러 발생:', error);
    return;
  }

  console.log('데이터:', data);
});
```

### 함정 4: 메모리 누수

Callback이 외부 변수를 참조하면 메모리 누수가 발생할 수 있습니다.

```javascript
// ❌ 메모리 누수 위험
function setupAutoSave() {
  const largeData = new Array(1000000).fill('data');

  setInterval(function() {
    // largeData를 계속 참조하여 메모리 해제 불가
    console.log('저장 중...', largeData.length);
  }, 1000);
}

setupAutoSave();
```

**해결책:**

```javascript
// ✅ 필요한 것만 참조
function setupAutoSave() {
  const largeData = new Array(1000000).fill('data');
  const dataLength = largeData.length; // 필요한 값만 저장

  const intervalId = setInterval(function() {
    console.log('저장 중...', dataLength);
  }, 1000);

  // 정리 함수 제공
  return function cleanup() {
    clearInterval(intervalId);
  };
}

const cleanup = setupAutoSave();

// 나중에 정리
cleanup();
```

### 함정 5: 동기/비동기 혼동

Callback이 동기인지 비동기인지 명확하지 않으면 버그가 발생합니다.

```javascript
// ❌ 예측 불가능한 동작
function maybeAsync(callback) {
  if (cache) {
    callback(cache); // 동기적으로 실행
  } else {
    fetchData(function(data) {
      callback(data); // 비동기적으로 실행
    });
  }
}

let result;
maybeAsync(function(data) {
  result = data;
});

console.log(result); // undefined? 또는 데이터? (예측 불가!)
```

**해결책: 항상 일관되게 비동기로 만들기**

```javascript
// ✅ 항상 비동기
function alwaysAsync(callback) {
  if (cache) {
    // 캐시가 있어도 비동기로 실행
    setTimeout(() => callback(cache), 0);
  } else {
    fetchData(function(data) {
      callback(data);
    });
  }
}

let result;
alwaysAsync(function(data) {
  result = data;
});

console.log(result); // 항상 undefined (예측 가능!)
```

### 함정 6: Callback을 여러 번 호출

Callback을 실수로 여러 번 호출하면 예상치 못한 동작이 발생합니다.

```javascript
// ❌ Callback이 두 번 호출될 수 있음
function fetchData(callback) {
  let called = false;

  setTimeout(function() {
    callback(null, 'data');
    // 실수로 또 호출!
    callback(null, 'data');
  }, 1000);
}

// ✅ 한 번만 호출되도록 보장
function fetchData(callback) {
  let called = false;

  function safeCallback(...args) {
    if (!called) {
      called = true;
      callback(...args);
    }
  }

  setTimeout(function() {
    safeCallback(null, 'data');
    // 다시 호출해도 무시됨
    safeCallback(null, 'data');
  }, 1000);
}
```

**유틸리티 함수로 만들기:**

```javascript
function once(callback) {
  let called = false;

  return function(...args) {
    if (!called) {
      called = true;
      callback(...args);
    }
  };
}

// 사용
function fetchData(callback) {
  const safeCallback = once(callback);

  setTimeout(function() {
    safeCallback(null, 'data');
    safeCallback(null, 'data'); // 무시됨
  }, 1000);
}
```

## 실전에서 활용하기

### 패턴 1: Error-First Callback (Node.js 스타일)

Node.js에서 표준으로 사용하는 패턴입니다.

```javascript
// 첫 번째 인자는 항상 에러, 두 번째는 결과
function readConfig(callback) {
  fs.readFile('config.json', 'utf8', function(error, data) {
    if (error) {
      callback(error, null);
      return;
    }

    try {
      const config = JSON.parse(data);
      callback(null, config);
    } catch (parseError) {
      callback(parseError, null);
    }
  });
}

// 사용
readConfig(function(error, config) {
  if (error) {
    console.error('설정 읽기 실패:', error);
    return;
  }

  console.log('설정:', config);
});
```

### 패턴 2: Promisify - Callback을 Promise로 변환

```javascript
// Callback 스타일 함수
function fetchData(url, callback) {
  setTimeout(() => {
    callback(null, { data: 'some data' });
  }, 1000);
}

// Promise로 변환하는 유틸리티
function promisify(fn) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      fn(...args, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  };
}

// 사용
const fetchDataPromise = promisify(fetchData);

fetchDataPromise('https://api.example.com')
  .then(data => console.log(data))
  .catch(error => console.error(error));

// 또는 async/await과 함께
async function loadData() {
  try {
    const data = await fetchDataPromise('https://api.example.com');
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}
```

**Node.js 내장 promisify:**

```javascript
const util = require('util');
const fs = require('fs');

// fs.readFile을 Promise 버전으로
const readFilePromise = util.promisify(fs.readFile);

// 사용
async function readConfig() {
  try {
    const data = await readFilePromise('config.json', 'utf8');
    const config = JSON.parse(data);
    return config;
  } catch (error) {
    console.error('설정 읽기 실패:', error);
    throw error;
  }
}
```

### 패턴 3: 병렬 실행 (Parallel Execution)

여러 비동기 작업을 동시에 실행합니다.

```javascript
function parallel(tasks, callback) {
  const results = [];
  let completed = 0;
  let hasError = false;

  if (tasks.length === 0) {
    callback(null, results);
    return;
  }

  tasks.forEach((task, index) => {
    task((error, result) => {
      if (hasError) return;

      if (error) {
        hasError = true;
        callback(error);
        return;
      }

      results[index] = result;
      completed++;

      if (completed === tasks.length) {
        callback(null, results);
      }
    });
  });
}

// 사용
parallel([
  (cb) => setTimeout(() => cb(null, 'Task 1'), 1000),
  (cb) => setTimeout(() => cb(null, 'Task 2'), 500),
  (cb) => setTimeout(() => cb(null, 'Task 3'), 1500)
], function(error, results) {
  if (error) {
    console.error('에러:', error);
  } else {
    console.log('결과:', results); // ['Task 1', 'Task 2', 'Task 3']
  }
});
```

**시각화:**

```
시작 ━━━━━━━━━━━━━━━━━━━━━━━━━━━→

Task 1: ████████████░░░░░░░░░ (1000ms)
Task 2: ██████░░░░░░░░░░░░░░░░ (500ms)  ← 가장 먼저 완료
Task 3: ████████████████████░ (1500ms)  ← 가장 늦게 완료

전체 시간: 1500ms (순차 실행 시 3000ms)
```

### 패턴 4: 순차 실행 (Series Execution)

작업을 순서대로 하나씩 실행합니다.

```javascript
function series(tasks, callback) {
  const results = [];
  let currentIndex = 0;

  function next() {
    if (currentIndex >= tasks.length) {
      callback(null, results);
      return;
    }

    const task = tasks[currentIndex];

    task((error, result) => {
      if (error) {
        callback(error);
        return;
      }

      results.push(result);
      currentIndex++;
      next(); // 다음 작업 실행
    });
  }

  next(); // 시작
}

// 사용
series([
  (cb) => {
    console.log('Task 1 실행');
    setTimeout(() => cb(null, 'Result 1'), 1000);
  },
  (cb) => {
    console.log('Task 2 실행');
    setTimeout(() => cb(null, 'Result 2'), 500);
  },
  (cb) => {
    console.log('Task 3 실행');
    setTimeout(() => cb(null, 'Result 3'), 1500);
  }
], function(error, results) {
  if (error) {
    console.error('에러:', error);
  } else {
    console.log('모든 작업 완료:', results);
  }
});

// 출력:
// Task 1 실행
// (1초 후)
// Task 2 실행
// (0.5초 후)
// Task 3 실행
// (1.5초 후)
// 모든 작업 완료: ['Result 1', 'Result 2', 'Result 3']
```

### 패턴 5: Waterfall (폭포수형 실행)

각 작업의 결과를 다음 작업에 전달합니다.

```javascript
function waterfall(tasks, callback) {
  let currentIndex = 0;

  function next(...args) {
    // 에러가 전달되었는지 확인
    const error = args[0];
    if (error) {
      callback(error);
      return;
    }

    if (currentIndex >= tasks.length) {
      callback(null, ...args.slice(1));
      return;
    }

    const task = tasks[currentIndex];
    currentIndex++;

    // 첫 번째 작업이면 인자 없음, 이후는 이전 결과 전달
    if (currentIndex === 1) {
      task(next);
    } else {
      task(...args.slice(1), next);
    }
  }

  next(); // 시작
}

// 사용: 사용자 정보 → 게시글 → 댓글 순차 로드
waterfall([
  // 1단계: 사용자 정보 가져오기
  (callback) => {
    setTimeout(() => {
      console.log('사용자 정보 로드');
      callback(null, { userId: 123, name: '홍길동' });
    }, 1000);
  },

  // 2단계: 사용자의 게시글 가져오기
  (user, callback) => {
    setTimeout(() => {
      console.log(`${user.name}의 게시글 로드`);
      callback(null, user, [
        { postId: 1, title: '첫 번째 글' },
        { postId: 2, title: '두 번째 글' }
      ]);
    }, 1000);
  },

  // 3단계: 첫 번째 게시글의 댓글 가져오기
  (user, posts, callback) => {
    setTimeout(() => {
      console.log(`"${posts[0].title}"의 댓글 로드`);
      callback(null, {
        user,
        post: posts[0],
        comments: [
          { commentId: 1, text: '좋은 글이네요!' },
          { commentId: 2, text: '감사합니다!' }
        ]
      });
    }, 1000);
  }
], function(error, result) {
  if (error) {
    console.error('에러:', error);
  } else {
    console.log('최종 결과:', result);
  }
});
```

### 패턴 6: 재시도 로직

실패 시 자동으로 재시도합니다.

```javascript
function retry(task, maxAttempts, delay, callback) {
  let attempts = 0;

  function attempt() {
    attempts++;

    task((error, result) => {
      if (error) {
        if (attempts < maxAttempts) {
          console.log(`실패 (${attempts}/${maxAttempts}), ${delay}ms 후 재시도...`);
          setTimeout(attempt, delay);
        } else {
          console.log(`최대 재시도 횟수 초과`);
          callback(error);
        }
      } else {
        console.log(`성공 (${attempts}번째 시도)`);
        callback(null, result);
      }
    });
  }

  attempt();
}

// 사용: 불안정한 API 호출
function unstableAPICall(callback) {
  // 70% 확률로 실패
  if (Math.random() < 0.7) {
    callback(new Error('API 호출 실패'));
  } else {
    callback(null, { data: '성공적으로 가져온 데이터' });
  }
}

retry(unstableAPICall, 5, 1000, function(error, result) {
  if (error) {
    console.error('최종 실패:', error.message);
  } else {
    console.log('최종 성공:', result);
  }
});
```

### 패턴 7: 디바운스와 스로틀

이벤트 발생 빈도를 제어합니다.

#### 디바운스 (Debounce)

```javascript
function debounce(callback, delay) {
  let timeoutId;

  return function(...args) {
    // 이전 타이머 취소
    clearTimeout(timeoutId);

    // 새로운 타이머 설정
    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

// 사용: 검색 입력
const searchInput = document.getElementById('search');

const debouncedSearch = debounce(function(event) {
  const query = event.target.value;
  console.log('검색 실행:', query);
  // API 호출
  fetch(`/api/search?q=${query}`)
    .then(response => response.json())
    .then(results => displayResults(results));
}, 500);

searchInput.addEventListener('input', debouncedSearch);
```

**시각화:**

```
사용자 입력: h e l l o
             ↓ ↓ ↓ ↓ ↓
타이머:      x x x x ✓
             ↑ ↑ ↑ ↑ 500ms 후 실행
             모두 취소됨

→ "hello"로 한 번만 검색 실행
```

#### 스로틀 (Throttle)

```javascript
function throttle(callback, delay) {
  let lastCall = 0;

  return function(...args) {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      callback(...args);
    }
  };
}

// 사용: 스크롤 이벤트
const throttledScroll = throttle(function() {
  console.log('스크롤 위치:', window.scrollY);
  // 무거운 작업 (예: 무한 스크롤)
}, 1000);

window.addEventListener('scroll', throttledScroll);
```

**시각화:**

```
스크롤 이벤트: |||||||||||||||||||||||||||
               ↓   ↓   ↓   ↓   ↓   ↓   ↓
실행:          ✓   x   ✓   x   ✓   x   ✓
               1초 대기  1초 대기  1초 대기

→ 1초에 한 번만 실행
```

## Callback vs Promise vs Async/Await

세 가지 방식을 비교해봅시다.

### 동일한 작업을 세 가지 방식으로

```javascript
// 1. Callback 방식
function fetchUserCallback(userId, callback) {
  setTimeout(() => {
    callback(null, { id: userId, name: '홍길동' });
  }, 1000);
}

fetchUserCallback(123, (error, user) => {
  if (error) {
    console.error(error);
  } else {
    console.log('사용자:', user);
  }
});

// 2. Promise 방식
function fetchUserPromise(userId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({ id: userId, name: '홍길동' });
    }, 1000);
  });
}

fetchUserPromise(123)
  .then(user => console.log('사용자:', user))
  .catch(error => console.error(error));

// 3. Async/Await 방식 (Promise 기반)
async function fetchUserAsync(userId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: userId, name: '홍길동' });
    }, 1000);
  });
}

async function main() {
  try {
    const user = await fetchUserAsync(123);
    console.log('사용자:', user);
  } catch (error) {
    console.error(error);
  }
}

main();
```

### 여러 작업 순차 처리 비교

```javascript
// Callback - Callback Hell
getUserCallback(123, (error, user) => {
  if (error) return handleError(error);

  getPostsCallback(user.id, (error, posts) => {
    if (error) return handleError(error);

    getCommentsCallback(posts[0].id, (error, comments) => {
      if (error) return handleError(error);

      display(user, posts, comments);
    });
  });
});

// Promise - 평평한 체인
getUserPromise(123)
  .then(user => getPostsPromise(user.id))
  .then(posts => getCommentsPromise(posts[0].id))
  .then(comments => display(comments))
  .catch(handleError);

// Async/Await - 동기 코드처럼
async function loadData() {
  try {
    const user = await getUserAsync(123);
    const posts = await getPostsAsync(user.id);
    const comments = await getCommentsAsync(posts[0].id);
    display(user, posts, comments);
  } catch (error) {
    handleError(error);
  }
}
```

### 장단점 비교

| 특징 | Callback | Promise | Async/Await |
|------|----------|---------|-------------|
| **가독성** | 🔴 나쁨 (깊은 중첩) | 🟡 보통 (체인) | 🟢 좋음 (동기 코드 같음) |
| **에러 처리** | 🔴 각 callback마다 처리 | 🟢 .catch()로 통합 | 🟢 try/catch로 통합 |
| **디버깅** | 🔴 어려움 | 🟡 보통 | 🟢 쉬움 |
| **학습 곡선** | 🟢 낮음 (기본 개념) | 🟡 보통 | 🟡 보통 |
| **브라우저 지원** | 🟢 모든 브라우저 | 🟢 IE 제외 | 🟡 최신 브라우저 |
| **병렬 실행** | 🔴 복잡함 | 🟢 Promise.all() | 🟢 Promise.all() + await |

### 언제 무엇을 사용할까?

#### Callback을 사용하세요:
- 🎯 레거시 코드와 통합할 때
- 🎯 간단한 이벤트 리스너
- 🎯 배열 메소드 (map, filter, reduce)
- 🎯 Node.js API (필요 시 promisify)

#### Promise를 사용하세요:
- 🎯 여러 비동기 작업을 조합할 때
- 🎯 병렬 실행이 필요할 때 (Promise.all)
- 🎯 에러 처리를 단순화하고 싶을 때
- 🎯 체이닝이 자연스러운 경우

#### Async/Await을 사용하세요:
- 🎯 순차적인 비동기 작업
- 🎯 복잡한 로직과 제어 흐름
- 🎯 동기 코드처럼 읽히게 하고 싶을 때
- 🎯 디버깅이 중요한 경우

## 결론: Callback을 언제 어떻게 사용할까?

### 핵심 요약

1. **Callback은 JavaScript 비동기의 기초입니다**
   - 모든 비동기 API의 근간입니다
   - Promise와 async/await도 내부적으로 callback을 사용합니다
   - JavaScript의 이벤트 기반 아키텍처를 이해하는 핵심입니다

2. **Callback의 장점**
   - ✅ 간단하고 직관적입니다
   - ✅ 모든 환경에서 작동합니다
   - ✅ 이벤트 리스너와 배열 메소드에 적합합니다
   - ✅ 학습 곡선이 낮습니다

3. **Callback의 단점**
   - ❌ Callback Hell (중첩 지옥)
   - ❌ 에러 처리가 번거롭습니다
   - ❌ 가독성이 떨어질 수 있습니다
   - ❌ 디버깅이 어렵습니다

4. **실전 가이드라인**
   - 간단한 경우: Callback 사용
   - 복잡한 경우: Promise나 async/await으로 전환
   - 레거시 코드: promisify로 변환
   - 이벤트: Callback 유지

### 실전 조언

```javascript
// ✅ 간단한 경우: Callback 사용
button.addEventListener('click', () => {
  console.log('클릭!');
});

// ✅ 복잡한 경우: async/await 사용
async function loadUserData() {
  try {
    const user = await fetchUser();
    const posts = await fetchPosts(user.id);
    const comments = await fetchComments(posts[0].id);
    return { user, posts, comments };
  } catch (error) {
    handleError(error);
  }
}

// ✅ 레거시 API: promisify로 변환
const readFileAsync = promisify(fs.readFile);

async function readConfig() {
  const data = await readFileAsync('config.json', 'utf8');
  return JSON.parse(data);
}

// ✅ 배열 메소드: Callback 계속 사용
const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
```

### 마지막 조언

Callback을 이해하는 것은 JavaScript를 마스터하는 데 필수적입니다. Promise와 async/await이 더 현대적이고 편리하지만, **Callback의 동작 원리를 이해해야 진정한 JavaScript 전문가가 될 수 있습니다.**

Callback은 도구입니다. 상황에 맞게 적절히 사용하세요. 간단한 경우에는 Callback으로 충분하고, 복잡한 경우에는 Promise나 async/await으로 전환하세요. 가장 중요한 것은 **코드의 의도가 명확하고 유지보수하기 쉽게 만드는 것**입니다.

## 참고 자료

### MDN 공식 문서
- [Callback function](https://developer.mozilla.org/en-US/docs/Glossary/Callback_function)
- [Asynchronous JavaScript](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous)
- [Introducing asynchronous JavaScript](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Introducing)
- [JavaScript Event Loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop)

### 심화 학습
- [You Don't Know JS: Async & Performance](https://github.com/getify/You-Dont-Know-JS/tree/1st-ed/async%20%26%20performance) - Kyle Simpson
- [JavaScript: The Good Parts](http://shop.oreilly.com/product/9780596517748.do) - Douglas Crockford
- [Eloquent JavaScript: Asynchronous Programming](https://eloquentjavascript.net/11_async.html)

### 관련 문서
- [promise.md](./promise.md) - Promise 이해하기
- [async_await.md](./async_await.md) - Async/Await 가이드
- [event_loop.md](./event_loop.md) - 이벤트 루프 깊이 이해하기
- [this.md](./this.md) - this 바인딩 문제 해결

### 추가 자료
- [Callback Hell](http://callbackhell.com/) - Callback Hell과 해결 방법
- [Understanding JavaScript Callbacks](https://www.javascripttutorial.net/javascript-callback/)
- [Node.js Design Patterns](https://www.nodejsdesignpatterns.com/) - Callback 패턴들
- [Async JavaScript: From Callbacks, to Promises, to Async/Await](https://ui.dev/async-javascript-from-callbacks-to-promises-to-async-await)
