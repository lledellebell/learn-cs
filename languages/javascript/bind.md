---
title: `bind()` 메소드 - this가 사라지는 문제를 해결하는 마법
date: 2025-10-10
categories: [Programming, JavaScript]
tags: [bind, this, Context, Function Methods, Partial Application]
layout: page
---
# `bind()` 메소드 - this가 사라지는 문제를 해결하는 마법

React로 클래스 컴포넌트를 처음 만들 때 이런 경험을 한 적이 있나요?

```javascript
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  increment() {
    this.setState({ count: this.state.count + 1 });
  }

  render() {
    return <button onClick={this.increment}>클릭</button>;
  }
}
```

버튼을 클릭하면... **에러 발생!** 💥

```
TypeError: Cannot read property 'setState' of undefined
```

"분명히 `this.increment`라고 썼는데 왜 `this`가 `undefined`지?" 저도 처음에는 이 문제로 몇 시간을 헤맸습니다. 그리고 누군가 알려준 해결책:

```javascript
<button onClick={this.increment.bind(this)}>클릭</button>
```

신기하게도 작동합니다! 하지만 "왜 `bind(this)`를 써야 하는가?"에 대한 깊은 이해 없이 그냥 "그렇게 하라니까 하는구나"라고만 생각했습니다.

이 문서에서는 `bind()`가 무엇인지, 왜 필요한지, 그리고 실제로 어떻게 활용해야 하는지를 실무 경험을 바탕으로 자세히 설명하겠습니다.

## 왜 bind를 배워야 할까요?

### 1. JavaScript의 this는 예측하기 어렵습니다

다른 언어에서 온 개발자들이 가장 혼란스러워하는 것이 바로 JavaScript의 `this`입니다:

```javascript
const person = {
  name: '홍길동',
  greet() {
    console.log(`안녕하세요, ${this.name}입니다.`);
  }
};

person.greet(); // "안녕하세요, 홍길동입니다." ✅

const greet = person.greet;
greet(); // "안녕하세요, undefined입니다." ❌
```

같은 함수인데 호출 방식에 따라 `this`가 달라집니다! 이것이 바로 `bind()`가 필요한 이유입니다.

### 2. 이벤트 핸들러와 콜백에서 필수입니다

실무에서 가장 많이 마주치는 상황입니다:

```javascript
class Timer {
  constructor() {
    this.seconds = 0;
  }

  start() {
    // ❌ this가 사라짐!
    setInterval(function() {
      this.seconds++; // undefined.seconds++
      console.log(this.seconds);
    }, 1000);
  }
}

const timer = new Timer();
timer.start(); // NaN, NaN, NaN...
```

`bind()`를 이해하지 못하면 이런 버그와 싸우며 시간을 낭비하게 됩니다.

### 3. 함수형 프로그래밍의 기초입니다

`bind()`의 부분 적용(Partial Application) 기능은 함수형 프로그래밍에서 매우 유용합니다:

```javascript
function multiply(a, b) {
  return a * b;
}

const double = multiply.bind(null, 2);
const triple = multiply.bind(null, 3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
```

이것은 단순히 "편리한 기능"이 아니라, **재사용 가능한 코드를 만드는 강력한 도구**입니다.

## 목차

- [정의](#정의)
- [문법](#문법)
- [동작 원리](#동작-원리)
- [주요 사용 사례](#주요-사용-사례)
- [상세 예제](#상세-예제)
- [주의사항](#주의사항)
- [실전 활용](#실전-활용)
- [참고 자료](#참고-자료)

## 정의

`bind()`는 Function 인스턴스의 메소드로, **새로운 함수를 생성**하며 이 함수는 지정된 `this` 값과 선택적으로 미리 설정된 인자들을 가집니다.

### 핵심 특징

- 원본 함수를 수정하지 않고 새로운 함수를 반환
- `this` 컨텍스트를 영구적으로 고정
- 부분 적용(Partial Application) 가능

**간단히 말하면:**
`bind()`는 "이 함수의 `this`는 무조건 이거야!"라고 못 박는 기능입니다. 그리고 추가로 "첫 번째 인자는 무조건 이거야!"같은 설정도 가능합니다.

## 문법

```javascript
bind(thisArg)
bind(thisArg, arg1)
bind(thisArg, arg1, arg2)
bind(thisArg, arg1, arg2, /* …, */ argN)
```

### 매개변수

- **`thisArg`**: 바인딩된 함수가 호출될 때 `this`로 사용될 값
- **`arg1, ..., argN`** (선택): 함수 호출 시 미리 설정할 인자들

### 반환값

지정된 `this` 값과 초기 인자들이 설정된 **새로운 함수**

## 동작 원리

### 1. this 바인딩

`bind()`의 가장 기본적인 역할은 함수의 `this` 값을 고정하는 것입니다.

```javascript
const module = {
  x: 42,
  getX() {
    return this.x;
  }
};

// this가 module에 바인딩된 새 함수 생성
const boundGetX = module.getX.bind(module);

console.log(boundGetX()); // 42

// this 컨텍스트를 잃어버리는 경우
const unboundGetX = module.getX;
console.log(unboundGetX()); // undefined (strict mode) 또는 전역 객체의 x
```

### 2. 부분 적용 (Partial Application)

인자를 미리 설정하여 새로운 함수를 만들 수 있습니다.

```javascript
function multiply(a, b) {
  return a * b;
}

// 첫 번째 인자를 2로 고정
const double = multiply.bind(null, 2);

console.log(double(5));  // 10
console.log(double(10)); // 20
```

## 주요 사용 사례

### 1. 메소드의 this 컨텍스트 보존

객체의 메소드를 콜백으로 전달할 때 `this`가 손실되는 것을 방지합니다.

```javascript
class Counter {
  constructor() {
    this.count = 0;
  }

  increment() {
    this.count++;
    console.log(this.count);
  }
}

const counter = new Counter();

// ❌ this 손실
setTimeout(counter.increment, 1000); // TypeError 또는 undefined

// ✅ bind로 this 보존
setTimeout(counter.increment.bind(counter), 1000); // 1
```

### 2. 이벤트 핸들러에서 this 고정

```javascript
class Button {
  constructor(label) {
    this.label = label;
    this.clickCount = 0;
  }

  handleClick() {
    this.clickCount++;
    console.log(`${this.label} 클릭 횟수: ${this.clickCount}`);
  }

  attachToElement(element) {
    // bind를 사용하여 this를 Button 인스턴스로 고정
    element.addEventListener('click', this.handleClick.bind(this));
  }
}

const submitButton = new Button('제출');
const buttonElement = document.querySelector('#submit');
submitButton.attachToElement(buttonElement);
```

### 3. 메소드를 독립 함수로 변환

```javascript
const user = {
  name: 'Alice',
  greet(greeting) {
    return `${greeting}, ${this.name}!`;
  }
};

// 메소드를 독립적인 함수로 변환
const greetAlice = user.greet.bind(user);

console.log(greetAlice('안녕하세요'));  // "안녕하세요, Alice!"
console.log(greetAlice('Hello'));      // "Hello, Alice!"

// 다른 곳에서 자유롭게 사용 가능
const greetings = ['Hi', 'Hey', 'Welcome'].map(greetAlice);
// ["Hi, Alice!", "Hey, Alice!", "Welcome, Alice!"]
```

### 4. 부분 적용으로 재사용 가능한 함수 생성

```javascript
function log(level, message) {
  console.log(`[${level}] ${message}`);
}

// 특정 레벨의 로거 생성
const errorLog = log.bind(null, 'ERROR');
const infoLog = log.bind(null, 'INFO');
const warnLog = log.bind(null, 'WARN');

errorLog('데이터베이스 연결 실패'); // [ERROR] 데이터베이스 연결 실패
infoLog('서버 시작됨');              // [INFO] 서버 시작됨
warnLog('메모리 사용량 높음');       // [WARN] 메모리 사용량 높음
```
****
## 상세 예제

### 예제 1: React 클래스 컴포넌트에서 this 바인딩

```javascript
class TodoList extends React.Component {
  constructor(props) {
    super(props);
    this.state = { todos: [] };

    // 생성자에서 bind하여 불필요한 재생성 방지
    this.addTodo = this.addTodo.bind(this);
  }

  addTodo(text) {
    this.setState({
      todos: [...this.state.todos, text]
    });
  }

  render() {
    return (
      <div>
        {/* bind 없이 사용 가능 */}
        <button onClick={this.addTodo}>할 일 추가</button>
      </div>
    );
  }
}
```

### 예제 2: 함수 커리화 (Currying)

```javascript
function greet(greeting, punctuation, name) {
  return `${greeting}, ${name}${punctuation}`;
}

// 1단계: greeting 고정
const sayHello = greet.bind(null, 'Hello');
console.log(sayHello('!', 'Alice')); // "Hello, Alice!"

// 2단계: greeting과 punctuation 고정
const sayHelloExcited = greet.bind(null, 'Hello', '!');
console.log(sayHelloExcited('Bob')); // "Hello, Bob!"
```

### 예제 3: 배열 메소드와 함께 사용

```javascript
const numbers = [1, 2, 3, 4, 5];

// Array.prototype.slice를 독립 함수로 사용
const slice = Array.prototype.slice;

// arguments를 배열로 변환하는 함수
function toArray() {
  return slice.call(arguments);
}

// 또는 bind로 더 간결하게
const arrayFrom = slice.bind(Array.prototype);

function sum() {
  const args = arrayFrom.call(arguments);
  return args.reduce((a, b) => a + b, 0);
}

console.log(sum(1, 2, 3, 4, 5)); // 15
```

### 예제 4: setTimeout/setInterval과 함께 사용

```javascript
class Timer {
  constructor() {
    this.seconds = 0;
  }

  start() {
    // bind를 사용하여 this 보존
    setInterval(function() {
      this.seconds++;
      console.log(`경과 시간: ${this.seconds}초`);
    }.bind(this), 1000);
  }

  // 또는 화살표 함수 사용 (더 현대적)
  startModern() {
    setInterval(() => {
      this.seconds++;
      console.log(`경과 시간: ${this.seconds}초`);
    }, 1000);
  }
}

const timer = new Timer();
timer.start();
```

### 예제 5: 메소드 차용 (Method Borrowing)

```javascript
// 배열 메소드를 유사 배열 객체에 사용
const arrayLike = {
  0: 'a',
  1: 'b',
  2: 'c',
  length: 3
};

// Array.prototype.map을 차용
const map = Array.prototype.map;
const result = map.call(arrayLike, x => x.toUpperCase());
console.log(result); // ['A', 'B', 'C']

// bind로 재사용 가능한 함수 생성
const mapArrayLike = map.bind(arrayLike);
```

## 주의사항

### 1. bind는 한 번만 효과적

```javascript
function getThis() {
  return this;
}

const obj1 = { name: 'obj1' };
const obj2 = { name: 'obj2' };

const bound1 = getThis.bind(obj1);
const bound2 = bound1.bind(obj2); // obj2로 다시 바인딩 시도

console.log(bound1()); // { name: 'obj1' }
console.log(bound2()); // { name: 'obj1' } - obj1이 유지됨!
```

**이유**: 바인딩된 함수를 다시 바인딩해도 원래의 `this`는 변경되지 않습니다.

### 2. 화살표 함수는 bind 불가

```javascript
const arrowFunc = () => {
  return this;
};

const obj = { name: 'test' };
const boundArrow = arrowFunc.bind(obj);

console.log(boundArrow()); // this는 여전히 렉시컬 스코프의 this
```

**이유**: 화살표 함수는 자신의 `this`를 가지지 않으며, 렉시컬 스코프의 `this`를 사용합니다.

### 3. new 연산자와 함께 사용 시

```javascript
function Point(x, y) {
  this.x = x;
  this.y = y;
}

const YAxisPoint = Point.bind(null, 0);

const point = new YAxisPoint(5);
console.log(point.x); // 0
console.log(point.y); // 5
console.log(point instanceof Point); // true
```

**주의**: 바인딩된 함수를 생성자로 사용하면 바인딩된 `this`는 무시되고, `new`로 생성된 인스턴스가 `this`가 됩니다.

### 4. 함수 속성 변경

```javascript
function example(a, b, c) {
  // ...
}

console.log(example.length); // 3 (매개변수 개수)
console.log(example.name);   // "example"

const bound = example.bind(null, 1, 2);

console.log(bound.length);   // 1 (남은 매개변수 개수)
console.log(bound.name);     // "bound example"
```

### 5. 성능 고려사항

```javascript
class Component {
  constructor() {
    this.count = 0;
  }

  // ❌ 나쁜 예: 렌더링마다 새로운 함수 생성
  renderBad() {
    return <button onClick={this.handleClick.bind(this)}>클릭</button>;
  }

  // ✅ 좋은 예 1: 생성자에서 한 번만 바인딩
  constructor() {
    this.handleClick = this.handleClick.bind(this);
  }

  // ✅ 좋은 예 2: 화살표 함수 사용 (클래스 필드)
  handleClick = () => {
    this.count++;
  }
}
```

## 실전 활용

### 1. API 클라이언트 패턴

```javascript
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json'
    };

    // 메소드들을 바인딩하여 독립적으로 사용 가능하게 함
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.delete = this.delete.bind(this);
  }

  async request(endpoint, options) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: { ...this.headers, ...options.headers }
    };

    const response = await fetch(url, config);
    return response.json();
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// 사용
const api = new APIClient('https://api.example.com');

// 메소드를 독립적으로 전달 가능
const fetchUser = api.get;
fetchUser('/users/1').then(console.log);
```

### 2. 파이프라인 패턴

```javascript
// 부분 적용을 활용한 함수 파이프라인
const add = (a, b) => a + b;
const multiply = (a, b) => a * b;
const subtract = (a, b) => a - b;

// 특정 값으로 연산하는 함수들 생성
const add10 = add.bind(null, 10);
const multiplyBy2 = multiply.bind(null, 2);
const subtract5 = subtract.bind(null, 5);

function pipe(...fns) {
  return (value) => fns.reduce((acc, fn) => fn(acc), value);
}

// 파이프라인 구성
const calculate = pipe(
  add10,        // 5 + 10 = 15
  multiplyBy2,  // 15 * 2 = 30
  subtract5     // 30 - 5 = 25
);

console.log(calculate(5)); // 25
```

### 3. 유효성 검사기 패턴

```javascript
function validate(rules, value) {
  return rules.every(rule => rule(value));
}

// 범위 검사 함수
function isInRange(min, max, value) {
  return value >= min && value <= max;
}

// 길이 검사 함수
function hasLength(min, max, value) {
  return value.length >= min && value.length <= max;
}

// 특정 범위에 대한 검사기 생성
const isAdultAge = isInRange.bind(null, 18, 120);
const isValidUsername = hasLength.bind(null, 3, 20);
const isValidPassword = hasLength.bind(null, 8, 50);

console.log(isAdultAge(25));              // true
console.log(isValidUsername('abc'));      // true
console.log(isValidPassword('12345'));    // false
```

### 4. 디바운스/쓰로틀과 함께 사용

```javascript
class SearchBox {
  constructor() {
    this.results = [];

    // 디바운스된 검색 함수 생성
    this.search = this.debounce(this.performSearch.bind(this), 300);
  }

  performSearch(query) {
    console.log(`검색 중: ${query}`);
    // API 호출 로직
    fetch(`/api/search?q=${query}`)
      .then(res => res.json())
      .then(data => {
        this.results = data;
      });
  }

  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  handleInput(event) {
    this.search(event.target.value);
  }
}
```

## bind vs call vs apply

### 비교표

| 메소드 | 실행 시점 | this 바인딩 | 인자 전달 방식 | 반환값 |
|--------|-----------|-------------|----------------|--------|
| `bind()` | **나중에** 실행 | 영구적 | 개별 인자 | **새 함수** |
| `call()` | **즉시** 실행 | 일시적 | 개별 인자 | 함수 실행 결과 |
| `apply()` | **즉시** 실행 | 일시적 | 배열 | 함수 실행 결과 |

### 예제 비교

```javascript
const person = {
  name: 'Alice',
  greet(greeting, punctuation) {
    return `${greeting}, ${this.name}${punctuation}`;
  }
};

const anotherPerson = { name: 'Bob' };

// bind: 새 함수 생성 (나중에 호출)
const greetBob = person.greet.bind(anotherPerson, 'Hello');
console.log(greetBob('!'));  // "Hello, Bob!"

// call: 즉시 실행 (개별 인자)
console.log(person.greet.call(anotherPerson, 'Hello', '!'));  // "Hello, Bob!"

// apply: 즉시 실행 (배열 인자)
console.log(person.greet.apply(anotherPerson, ['Hello', '!']));  // "Hello, Bob!"
```

### 언제 무엇을 사용할까?

```javascript
// ✅ bind: 나중에 호출될 함수가 필요할 때
button.addEventListener('click', this.handleClick.bind(this));

// ✅ call: 즉시 실행하되 this를 명시하고 싶을 때
Array.prototype.push.call(arrayLike, newItem);

// ✅ apply: 즉시 실행하되 인자가 배열일 때
Math.max.apply(null, [1, 2, 3, 4, 5]);

// 현대적 방법: spread 연산자
Math.max(...[1, 2, 3, 4, 5]);
```

## 대안: 화살표 함수

많은 경우 화살표 함수가 `bind()`보다 더 간결하고 읽기 쉬운 대안이 될 수 있습니다.

### bind 사용

```javascript
class Component {
  constructor() {
    this.state = { count: 0 };
    this.increment = this.increment.bind(this);
  }

  increment() {
    this.state.count++;
  }
}
```

### 화살표 함수 사용 (더 현대적)

```javascript
class Component {
  state = { count: 0 };

  // 클래스 필드로 화살표 함수 정의
  increment = () => {
    this.state.count++;
  }
}
```

### 언제 bind를 사용할까?

- 부분 적용이 필요할 때
- 기존 함수를 재사용하면서 this를 변경해야 할 때
- 화살표 함수를 사용할 수 없는 환경일 때
- 프로토타입 메소드를 정의할 때

```javascript
// bind가 더 적합한 경우: 부분 적용
const add = (a, b, c) => a + b + c;
const add5 = add.bind(null, 5);  // 첫 인자를 5로 고정

console.log(add5(10, 20));  // 35

// 화살표 함수로는 불가능
```

## 참고 자료

### MDN 공식 문서

- [Function.prototype.bind()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) - bind 메소드 상세 문서
- [Function.prototype.call()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call) - call 메소드
- [Function.prototype.apply()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply) - apply 메소드
- [this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) - JavaScript의 this 키워드
- [Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) - 화살표 함수

### 관련 개념

- [Currying](https://javascript.info/currying-partials) - 함수 커리화
- [Partial Application](https://javascript.info/currying-partials) - 부분 적용
- [Method Borrowing](https://javascript.info/bind#method-borrowing) - 메소드 차용

### 추가 학습 자료

- [You Don't Know JS: this & Object Prototypes](https://github.com/getify/You-Dont-Know-JS/tree/1st-ed/this%20%26%20object%20prototypes) - Kyle Simpson
- [JavaScript.info: Function binding](https://javascript.info/bind) - 바인딩 상세 가이드
- [Exploring JS: this and bind](https://exploringjs.com/es6/ch_arrow-functions.html) - Dr. Axel Rauschmayer

### 관련 문서

- [this.md](./this.md) - JavaScript의 this 키워드 이해
- [callback.md](./callback.md) - 콜백 함수와 this
- [prototype.md](./prototype.md) - 프로토타입과 메소드
