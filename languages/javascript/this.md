---
title: this 키워드 - JavaScript에서 가장 혼란스러운 개념을 정복하기
date: 2025-10-13
layout: page
---
# this 키워드 - JavaScript에서 가장 혼란스러운 개념을 정복하기

이 코드를 보세요:

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

**같은 함수인데 왜 결과가 다를까요?**

저도 JavaScript를 처음 배울 때 이 문제로 며칠을 고생했습니다. Python이나 Java에서 넘어온 개발자라면 더욱 혼란스러울 것입니다. 다른 언어에서 `this`(또는 `self`)는 객체 자신을 가리키는 명확한 개념이지만, **JavaScript의 `this`는 호출 방식에 따라 달라집니다.**

React로 클래스 컴포넌트를 만들 때 이런 에러를 본 적이 있나요?

```javascript
class Counter extends React.Component {
  increment() {
    this.setState({ count: this.state.count + 1 });
  }

  render() {
    return <button onClick={this.increment}>클릭</button>;
  }
}

// 버튼 클릭 시 💥
// TypeError: Cannot read property 'setState' of undefined
```

또는 이벤트 리스너를 추가하다가:

```javascript
class Timer {
  constructor() {
    this.seconds = 0;
  }

  start() {
    setInterval(function() {
      this.seconds++; // 💥 undefined.seconds++
      console.log(this.seconds);
    }, 1000);
  }
}

const timer = new Timer();
timer.start(); // NaN, NaN, NaN...
```

이 문서는 JavaScript의 `this`가 왜 이렇게 혼란스러운지, 어떤 규칙으로 동작하는지, 그리고 실제로 어떻게 다뤄야 하는지를 실무 경험을 바탕으로 깊이 있게 설명합니다. 수많은 버그와 삽질 끝에 얻은 지식을 여러분과 공유하겠습니다.

## 목차

- [왜 this가 이렇게 복잡할까요?](#왜-this가-이렇게-복잡할까요)
- [핵심: 4가지 바인딩 규칙](#핵심-4가지-바인딩-규칙)
  - [1. 기본 바인딩 (Default Binding)](#1-기본-바인딩-default-binding)
  - [2. 암시적 바인딩 (Implicit Binding)](#2-암시적-바인딩-implicit-binding)
  - [3. 명시적 바인딩 (Explicit Binding)](#3-명시적-바인딩-explicit-binding)
  - [4. new 바인딩](#4-new-바인딩)
- [화살표 함수와 렉시컬 this](#화살표-함수와-렉시컬-this)
- [우선순위 규칙](#우선순위-규칙)
- [함정과 주의사항](#함정과-주의사항)
- [실전에서 활용하기](#실전에서-활용하기)
- [참고 자료](#참고-자료)

## 왜 this가 이렇게 복잡할까요?

### JavaScript의 독특한 설계 철학

대부분의 객체지향 언어에서 `this`는 **정적(static)**으로 결정됩니다:

```python
# Python
class Person:
    def __init__(self, name):
        self.name = name

    def greet(self):
        print(f"안녕하세요, {self.name}입니다.")

person = Person("홍길동")
greet_fn = person.greet
greet_fn()  # 항상 "안녕하세요, 홍길동입니다." ✅
```

Python의 `self`는 메소드가 정의된 순간에 고정됩니다. **메소드는 자신이 속한 객체를 기억합니다.**

하지만 JavaScript는 다릅니다:

```javascript
// JavaScript
const person = {
  name: '홍길동',
  greet() {
    console.log(`안녕하세요, ${this.name}입니다.`);
  }
};

const greet = person.greet;
greet(); // "안녕하세요, undefined입니다." ❌
```

JavaScript의 `this`는 **동적(dynamic)**으로 결정됩니다. 함수가 정의된 위치가 아니라 **호출되는 방식**에 따라 `this`가 결정됩니다.

### 왜 이런 설계를 했을까?

JavaScript는 함수를 **1급 객체(First-class Object)**로 취급합니다. 함수를 변수에 할당하고, 인자로 전달하고, 다른 함수에서 반환할 수 있습니다. 이런 유연성을 위해 `this`를 동적으로 결정하도록 설계했습니다.

**장점:**
- 함수를 재사용하기 쉽습니다
- 메소드 빌림(Method Borrowing)이 가능합니다
- 콜백 패턴을 유연하게 사용할 수 있습니다

**단점:**
- 예측하기 어렵습니다
- 버그가 발생하기 쉽습니다
- 학습 곡선이 가파릅니다

저도 처음에는 "왜 이렇게 복잡하게 만들었지?"라고 불평했지만, 규칙을 이해하고 나니 이 유연성이 강력한 도구가 될 수 있다는 것을 깨달았습니다.

### 핵심 개념: 호출부(Call-site)

`this`를 이해하는 가장 중요한 개념은 **호출부(Call-site)**입니다. 호출부는 함수가 **호출되는 위치**를 말합니다.

```javascript
function identify() {
  return this.name;
}

const person = {
  name: '홍길동',
  identify: identify
};

// 호출부 1: 전역에서 호출
identify(); // this는 전역 객체 (또는 undefined)

// 호출부 2: 객체 메소드로 호출
person.identify(); // this는 person 객체
```

**같은 함수지만 호출부에 따라 `this`가 달라집니다.** 이것이 JavaScript `this`의 핵심입니다.

## 핵심: 4가지 바인딩 규칙

`this`가 무엇인지 알려면 다음 4가지 규칙을 순서대로 확인하면 됩니다. 이 규칙들은 우선순위가 있으며, 나중에 설명할 우선순위에 따라 적용됩니다.

### 1. 기본 바인딩 (Default Binding)

**가장 기본적인 규칙입니다. 다른 규칙이 적용되지 않을 때 사용됩니다.**

```javascript
function showThis() {
  console.log(this);
}

showThis(); // 전역 객체 (브라우저: window, Node.js: global)
```

#### Strict Mode에서는 다릅니다

```javascript
'use strict';

function showThis() {
  console.log(this);
}

showThis(); // undefined
```

**왜 undefined일까요?**

Strict mode에서는 실수로 전역 변수를 만드는 것을 방지하기 위해 기본 바인딩을 `undefined`로 설정합니다. 이것은 **의도적인 설계**입니다.

#### 시각화

```
호출: showThis()
        ↓
    [호출부 분석]
        ↓
    독립 함수 호출?
        ↓
    Yes → 기본 바인딩
        ↓
    this = 전역 객체 (또는 undefined)
```

#### 실수하기 쉬운 예제

```javascript
function outer() {
  function inner() {
    console.log(this);
  }

  inner(); // ❌ this는 전역 객체!
}

outer();
```

많은 초보자들이 "inner는 outer 안에 있으니까 this도 outer의 것을 쓰겠지?"라고 생각합니다. **하지만 아닙니다!** `inner()`는 독립 함수 호출이므로 기본 바인딩이 적용됩니다.

#### 또 다른 함정

```javascript
const obj = {
  count: 0,
  increment: function() {
    console.log(this); // obj ✅

    function helper() {
      console.log(this); // 전역 객체! ❌
      this.count++; // 전역 객체의 count를 증가시킴
    }

    helper(); // 독립 함수 호출
  }
};

obj.increment();
console.log(obj.count); // 여전히 0
```

이 버그로 몇 시간씩 디버깅한 경험이 있습니다. `helper()`는 `obj.increment()` 안에 있지만, **독립 함수로 호출**되므로 기본 바인딩이 적용됩니다.

**해결책:**

```javascript
// 방법 1: that 패턴 (구식이지만 명확함)
const obj = {
  count: 0,
  increment: function() {
    const that = this; // this를 변수에 저장

    function helper() {
      console.log(that); // obj ✅
      that.count++;
    }

    helper();
  }
};

// 방법 2: 화살표 함수 (현대적)
const obj = {
  count: 0,
  increment: function() {
    const helper = () => {
      console.log(this); // obj ✅
      this.count++;
    };

    helper();
  }
};

// 방법 3: bind 사용
const obj = {
  count: 0,
  increment: function() {
    function helper() {
      console.log(this); // obj ✅
      this.count++;
    }

    helper.call(this); // 또는 helper.bind(this)()
  }
};
```

### 2. 암시적 바인딩 (Implicit Binding)

**객체의 메소드로 호출될 때 적용되는 규칙입니다.**

```javascript
const person = {
  name: '홍길동',
  greet() {
    console.log(`안녕하세요, ${this.name}입니다.`);
  }
};

person.greet(); // this는 person
```

#### 핵심: 점(.) 앞의 객체

호출부에서 **점(.) 바로 앞에 있는 객체**가 `this`가 됩니다.

```javascript
const obj1 = {
  name: 'obj1',
  obj2: {
    name: 'obj2',
    greet() {
      console.log(this.name);
    }
  }
};

obj1.obj2.greet(); // "obj2" - 점 바로 앞은 obj2
```

#### 시각화

```
호출: person.greet()
        ↓
    [호출부 분석]
        ↓
    객체.메소드() 형태?
        ↓
    Yes → 암시적 바인딩
        ↓
    this = 점(.) 앞의 객체 (person)
```

#### 함정: 암시적 바인딩 손실

**가장 흔한 버그 중 하나입니다:**

```javascript
const person = {
  name: '홍길동',
  greet() {
    console.log(`안녕하세요, ${this.name}입니다.`);
  }
};

// ❌ 함수 참조를 변수에 할당
const greet = person.greet;
greet(); // "안녕하세요, undefined입니다."
```

**왜 이런 일이 발생할까요?**

`person.greet`는 함수 객체의 **참조**를 반환합니다. 이 참조를 `greet` 변수에 할당하면, 함수와 객체의 연결이 끊어집니다.

```javascript
// 이렇게 생각해보세요:
const greet = person.greet; // 함수 참조만 복사
// 이제 greet는 독립 함수

greet(); // 독립 함수 호출 → 기본 바인딩
```

#### 콜백에서의 암시적 바인딩 손실

**실무에서 가장 많이 겪는 문제:**

```javascript
// 예제 1: setTimeout
const timer = {
  seconds: 0,
  start() {
    setTimeout(this.tick, 1000); // ❌
  },
  tick() {
    this.seconds++;
    console.log(this.seconds);
  }
};

timer.start(); // TypeError: Cannot read property 'seconds' of undefined
```

**무슨 일이 일어난 걸까요?**

```javascript
setTimeout(this.tick, 1000);
// ↓
// setTimeout 내부에서 실제로 일어나는 일:
function setTimeout(callback, delay) {
  // ... 1000ms 후 ...
  callback(); // 독립 함수 호출! → 기본 바인딩
}
```

`this.tick`을 `setTimeout`에 전달하면 함수 참조만 전달됩니다. `setTimeout`이 나중에 `callback()`으로 호출하면 독립 함수 호출이 되므로 `this`가 사라집니다!

**해결책:**

```javascript
// 방법 1: 화살표 함수로 래핑
timer.start() {
  setTimeout(() => this.tick(), 1000); // ✅
}

// 방법 2: bind 사용
timer.start() {
  setTimeout(this.tick.bind(this), 1000); // ✅
}

// 방법 3: 변수에 저장
timer.start() {
  const that = this;
  setTimeout(function() {
    that.tick();
  }, 1000); // ✅
}
```

#### 예제 2: 배열 메소드

```javascript
const counter = {
  count: 0,
  numbers: [1, 2, 3],

  sumAll() {
    this.numbers.forEach(function(num) {
      this.count += num; // ❌ this는 undefined
    });
  }
};

counter.sumAll(); // TypeError
```

**해결책:**

```javascript
// 방법 1: 화살표 함수
sumAll() {
  this.numbers.forEach(num => {
    this.count += num; // ✅
  });
}

// 방법 2: forEach의 thisArg 인자 활용
sumAll() {
  this.numbers.forEach(function(num) {
    this.count += num; // ✅
  }, this); // 두 번째 인자로 this 전달
}

// 방법 3: bind
sumAll() {
  this.numbers.forEach(function(num) {
    this.count += num; // ✅
  }.bind(this));
}
```

#### 예제 3: React 클래스 컴포넌트

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
    // ❌ 이벤트 핸들러로 전달할 때 this가 손실됨
    return <button onClick={this.increment}>클릭</button>;
  }
}
```

React가 내부적으로 `this.increment()`를 호출하는 것이 아니라 `const fn = this.increment; fn();` 형태로 호출하기 때문에 `this`가 사라집니다.

**해결책:**

```javascript
// 방법 1: 생성자에서 bind
constructor(props) {
  super(props);
  this.state = { count: 0 };
  this.increment = this.increment.bind(this); // ✅
}

// 방법 2: 화살표 함수 클래스 필드
increment = () => {
  this.setState({ count: this.state.count + 1 }); // ✅
}

// 방법 3: 인라인 화살표 함수 (성능 이슈 있음)
render() {
  return <button onClick={() => this.increment()}>클릭</button>;
}
```

### 3. 명시적 바인딩 (Explicit Binding)

**개발자가 직접 `this`를 지정하는 방법입니다.**

JavaScript는 3가지 메소드를 제공합니다:
- `call()`: 즉시 실행, 인자를 개별로 전달
- `apply()`: 즉시 실행, 인자를 배열로 전달
- `bind()`: 새 함수 반환, 나중에 실행

#### call() 메소드

```javascript
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const person = { name: '홍길동' };

// call: 첫 번째 인자가 this, 나머지는 함수 인자
greet.call(person, '안녕하세요', '!');
// "안녕하세요, 홍길동!"
```

#### 시각화

```
greet.call(person, '안녕하세요', '!')
         ↓
    [명시적 바인딩]
         ↓
    this = person (명시적으로 지정)
         ↓
    함수 즉시 실행
```

#### apply() 메소드

`call()`과 동일하지만 인자를 배열로 받습니다:

```javascript
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const person = { name: '홍길동' };

// apply: 두 번째 인자가 배열
greet.apply(person, ['안녕하세요', '!']);
// "안녕하세요, 홍길동!"
```

**언제 apply를 사용할까?**

인자가 이미 배열 형태일 때 유용합니다:

```javascript
const numbers = [5, 6, 2, 3, 7];

// Math.max는 개별 인자를 받음
Math.max(5, 6, 2, 3, 7); // 7

// 배열이 있을 때는 apply 사용
Math.max.apply(null, numbers); // 7

// 현대적 방법: spread 연산자
Math.max(...numbers); // 7
```

#### bind() 메소드

**가장 강력하고 자주 사용되는 방법입니다.**

`call()`과 `apply()`는 즉시 실행하지만, `bind()`는 **새로운 함수를 반환**합니다:

```javascript
function greet(greeting) {
  return `${greeting}, ${this.name}!`;
}

const person = { name: '홍길동' };

// bind: 새 함수를 생성 (즉시 실행하지 않음)
const greetPerson = greet.bind(person);

// 나중에 호출
greetPerson('안녕하세요'); // "안녕하세요, 홍길동!"
greetPerson('Hello'); // "Hello, 홍길동!"
```

#### 하드 바인딩 (Hard Binding)

`bind()`로 생성된 함수는 **영구적으로 this가 고정**됩니다:

```javascript
function identify() {
  return this.name;
}

const person1 = { name: '홍길동' };
const person2 = { name: '김철수' };

const identifyPerson1 = identify.bind(person1);

// 어떻게 호출해도 this는 person1
identifyPerson1(); // "홍길동"
person2.identify = identifyPerson1;
person2.identify(); // 여전히 "홍길동"!

// 심지어 call/apply도 무시됨
identifyPerson1.call(person2); // "홍길동"
```

이것을 **하드 바인딩(Hard Binding)**이라고 합니다. 한 번 바인딩하면 절대 바뀌지 않습니다.

#### 부분 적용 (Partial Application)

`bind()`의 강력한 기능 중 하나는 인자를 미리 설정할 수 있다는 것입니다:

```javascript
function multiply(a, b) {
  return a * b;
}

// 첫 번째 인자를 2로 고정
const double = multiply.bind(null, 2);

double(5);  // 10
double(10); // 20

// 첫 번째 인자를 3으로 고정
const triple = multiply.bind(null, 3);

triple(5);  // 15
triple(10); // 30
```

**실용적인 예제:**

```javascript
function log(level, message) {
  console.log(`[${level}] ${new Date().toISOString()} - ${message}`);
}

// 특정 레벨의 로거 생성
const error = log.bind(null, 'ERROR');
const info = log.bind(null, 'INFO');
const debug = log.bind(null, 'DEBUG');

error('데이터베이스 연결 실패');
// [ERROR] 2025-10-13T10:30:00.000Z - 데이터베이스 연결 실패

info('서버 시작됨');
// [INFO] 2025-10-13T10:30:01.000Z - 서버 시작됨
```

#### call vs apply vs bind 비교

| 메소드 | 실행 시점 | 인자 전달 | 반환값 | 사용 사례 |
|--------|----------|---------|--------|----------|
| `call()` | 즉시 실행 | 개별 인자 | 함수 실행 결과 | 즉시 실행하고 싶을 때 |
| `apply()` | 즉시 실행 | 배열 | 함수 실행 결과 | 인자가 배열일 때 |
| `bind()` | 나중에 실행 | 개별 인자 | 새 함수 | 콜백, 이벤트 핸들러 |

```javascript
function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

const person = { name: '홍길동' };

// call: 즉시 실행
greet.call(person, 'Hello', '!'); // "Hello, 홍길동!"

// apply: 즉시 실행, 배열 인자
greet.apply(person, ['Hello', '!']); // "Hello, 홍길동!"

// bind: 새 함수 반환
const boundGreet = greet.bind(person, 'Hello');
boundGreet('!'); // "Hello, 홍길동!"
```

**bind()에 대한 더 자세한 내용은 [bind.md](/Users/b/personal/learn-cs/languages/javascript/bind.md) 문서를 참고하세요.**

### 4. new 바인딩

**생성자 함수로 객체를 생성할 때 적용되는 규칙입니다.**

```javascript
function Person(name) {
  this.name = name;
  this.greet = function() {
    console.log(`안녕하세요, ${this.name}입니다.`);
  };
}

const person = new Person('홍길동');
person.greet(); // "안녕하세요, 홍길동입니다."
```

#### new 연산자가 하는 일

`new` 키워드로 함수를 호출하면 다음 과정이 자동으로 일어납니다:

1. **새로운 빈 객체 생성**
2. **새 객체의 [[Prototype]]이 생성자 함수의 prototype에 연결**
3. **새 객체가 this로 바인딩**
4. **생성자 함수 실행**
5. **생성자가 다른 객체를 반환하지 않으면 새 객체 반환**

```javascript
// new Person('홍길동')이 실제로 하는 일:
function Person(name) {
  // 1. const this = {}; (새 객체 생성)
  // 2. this.__proto__ = Person.prototype; (프로토타입 연결)

  // 3. this 바인딩으로 함수 실행
  this.name = name;
  this.greet = function() {
    console.log(`안녕하세요, ${this.name}입니다.`);
  };

  // 4. return this; (명시적 return이 없으면)
}
```

#### 시각화

```
new Person('홍길동')
        ↓
    [new 바인딩]
        ↓
    1. 새 객체 생성: {}
    2. [[Prototype]] 연결
    3. this = 새 객체
    4. 생성자 실행
    5. 새 객체 반환
        ↓
    this = 새로 생성된 객체
```

#### 명시적 return이 있을 때

```javascript
// 객체를 반환하면 그 객체가 반환됨
function Person(name) {
  this.name = name;
  return { name: '김철수' }; // 명시적 반환
}

const person = new Person('홍길동');
console.log(person.name); // "김철수"

// 원시값을 반환하면 무시됨
function Person2(name) {
  this.name = name;
  return 'ignored'; // 무시됨
}

const person2 = new Person2('홍길동');
console.log(person2.name); // "홍길동"
```

#### 생성자 함수 vs 일반 함수

같은 함수라도 `new`를 붙이냐 안 붙이냐에 따라 완전히 다르게 동작합니다:

```javascript
function Person(name) {
  this.name = name;
}

// new 없이 호출 → 기본 바인딩
Person('홍길동');
console.log(window.name); // "홍길동" (전역 오염!)

// new와 함께 호출 → new 바인딩
const person = new Person('홍길동');
console.log(person.name); // "홍길동" ✅
```

**이런 실수를 방지하는 패턴:**

```javascript
function Person(name) {
  // new 없이 호출되면 에러
  if (!(this instanceof Person)) {
    throw new Error('Person은 new 키워드와 함께 호출해야 합니다');
  }

  this.name = name;
}

// 또는 자동으로 new 추가
function Person(name) {
  if (!(this instanceof Person)) {
    return new Person(name);
  }

  this.name = name;
}
```

#### 클래스는 자동으로 보호됨

ES6 클래스는 이런 문제를 자동으로 방지합니다:

```javascript
class Person {
  constructor(name) {
    this.name = name;
  }
}

const person = new Person('홍길동'); // ✅

Person('홍길동'); // TypeError: Class constructor cannot be invoked without 'new'
```

## 화살표 함수와 렉시컬 this

**화살표 함수는 4가지 규칙을 따르지 않습니다!**

화살표 함수는 자신의 `this`를 가지지 않으며, **렉시컬 스코프의 this를 사용**합니다. 즉, 화살표 함수가 정의된 위치에서 `this`를 상속받습니다.

### 일반 함수 vs 화살표 함수

```javascript
const obj = {
  name: '홍길동',

  // 일반 함수: 동적 this
  regularFunc: function() {
    console.log(this.name); // 호출 방식에 따라 다름
  },

  // 화살표 함수: 렉시컬 this
  arrowFunc: () => {
    console.log(this.name); // 정의될 때의 this (전역)
  }
};

obj.regularFunc(); // "홍길동" - obj가 this
obj.arrowFunc();   // undefined - 전역 객체의 name
```

### 시각화: 렉시컬 스코프

```javascript
const outer = {
  name: 'outer',

  method() {
    console.log(this.name); // "outer"

    // 화살표 함수는 method의 this를 상속
    const arrow = () => {
      console.log(this.name); // "outer" (method의 this)
    };

    // 일반 함수는 독립적인 this
    const regular = function() {
      console.log(this.name); // undefined (기본 바인딩)
    };

    arrow();
    regular();
  }
};

outer.method();
```

**다이어그램:**

```
outer.method() 호출
    ↓
method의 this = outer
    ↓
    ┌─────────────────────────┐
    │ method() {              │
    │   this → outer          │ ← 화살표 함수는 이 this를 상속
    │                         │
    │   arrow = () => {       │
    │     this → outer  ✅    │
    │   }                     │
    │                         │
    │   regular = function() {│
    │     this → undefined ❌ │ ← 일반 함수는 독립적인 this
    │   }                     │
    └─────────────────────────┘
```

### 왜 화살표 함수가 필요할까?

콜백에서 `this`를 잃어버리는 문제를 해결합니다:

```javascript
// ❌ 문제 상황
class Timer {
  constructor() {
    this.seconds = 0;
  }

  start() {
    setInterval(function() {
      this.seconds++; // this가 undefined!
      console.log(this.seconds);
    }, 1000);
  }
}

// ✅ 화살표 함수로 해결
class Timer {
  constructor() {
    this.seconds = 0;
  }

  start() {
    setInterval(() => {
      this.seconds++; // start의 this를 상속!
      console.log(this.seconds);
    }, 1000);
  }
}
```

### 화살표 함수는 bind/call/apply로 변경 불가

```javascript
const obj = {
  name: 'obj',
  arrowFunc: () => {
    console.log(this.name);
  }
};

const another = { name: 'another' };

// 모두 소용없음!
obj.arrowFunc.call(another);  // undefined (전역의 name)
obj.arrowFunc.apply(another); // undefined
obj.arrowFunc.bind(another)(); // undefined
```

화살표 함수의 `this`는 **완전히 고정**되어 있어서 어떤 방법으로도 변경할 수 없습니다.

### 언제 화살표 함수를 사용하지 말아야 할까?

#### 1. 객체 메소드

```javascript
// ❌ 나쁜 예
const person = {
  name: '홍길동',
  greet: () => {
    console.log(`안녕하세요, ${this.name}입니다.`);
  }
};

person.greet(); // "안녕하세요, undefined입니다."
```

객체 리터럴의 화살표 함수는 **전역 객체의 this**를 가집니다!

#### 2. 프로토타입 메소드

```javascript
// ❌ 나쁜 예
function Person(name) {
  this.name = name;
}

Person.prototype.greet = () => {
  console.log(`안녕하세요, ${this.name}입니다.`);
};

const person = new Person('홍길동');
person.greet(); // "안녕하세요, undefined입니다."
```

#### 3. 생성자 함수

```javascript
// ❌ 에러 발생
const Person = (name) => {
  this.name = name;
};

const person = new Person('홍길동');
// TypeError: Person is not a constructor
```

화살표 함수는 `new`와 함께 사용할 수 없습니다.

#### 4. 이벤트 리스너에서 이벤트 대상이 필요할 때

```javascript
// ❌ 나쁜 예
button.addEventListener('click', () => {
  console.log(this); // window (전역 객체)
  this.classList.toggle('active'); // 에러!
});

// ✅ 좋은 예
button.addEventListener('click', function() {
  console.log(this); // button 엘리먼트
  this.classList.toggle('active'); // 정상 동작
});
```

### 화살표 함수 사용 가이드

**✅ 화살표 함수를 사용하면 좋은 경우:**

1. 콜백 함수
2. 배열 메소드 (map, filter, forEach 등)
3. Promise 체인
4. 클래스 필드 (this를 고정하고 싶을 때)

**❌ 화살표 함수를 사용하면 안 되는 경우:**

1. 객체 메소드
2. 프로토타입 메소드
3. 생성자 함수
4. 동적 this가 필요한 경우

```javascript
// ✅ 좋은 사용 예
class DataFetcher {
  constructor() {
    this.data = [];
  }

  fetchData() {
    // 콜백에서 화살표 함수 사용
    fetch('/api/data')
      .then(response => response.json())
      .then(data => {
        this.data = data; // this가 DataFetcher 인스턴스
      });
  }

  processData() {
    // 배열 메소드에서 화살표 함수 사용
    return this.data.map(item => item.value * 2);
  }
}

// ❌ 나쁜 사용 예
const calculator = {
  value: 0,

  // 메소드는 일반 함수 사용
  add: function(num) {
    this.value += num;
  },

  // 화살표 함수는 this가 calculator가 아님!
  subtract: (num) => {
    this.value -= num; // 에러!
  }
};
```

## 우선순위 규칙

여러 규칙이 동시에 적용될 수 있을 때 어떤 규칙이 우선할까요?

### 우선순위 (높음 → 낮음)

1. **화살표 함수** (렉시컬 this, 변경 불가)
2. **new 바인딩** (생성자 호출)
3. **명시적 바인딩** (call, apply, bind)
4. **암시적 바인딩** (객체 메소드)
5. **기본 바인딩** (독립 함수 호출)

### 규칙 1: new vs 명시적 바인딩

```javascript
function Person(name) {
  this.name = name;
}

const obj = {};

// bind로 obj에 바인딩
const BoundPerson = Person.bind(obj);

// new로 호출하면?
const person = new BoundPerson('홍길동');

console.log(obj.name);    // undefined (obj는 영향 없음)
console.log(person.name); // "홍길동" (new가 우선!)
```

**new가 bind보다 우선합니다!**

### 규칙 2: 명시적 바인딩 vs 암시적 바인딩

```javascript
function greet() {
  console.log(this.name);
}

const person1 = { name: '홍길동', greet };
const person2 = { name: '김철수' };

// 암시적 바인딩
person1.greet(); // "홍길동"

// 명시적 바인딩이 우선
person1.greet.call(person2); // "김철수"
```

**명시적 바인딩이 암시적 바인딩보다 우선합니다!**

### 규칙 3: 암시적 바인딩 vs 기본 바인딩

```javascript
function greet() {
  console.log(this.name);
}

const person = { name: '홍길동', greet };

// 암시적 바인딩
person.greet(); // "홍길동"

// 참조를 잃으면 기본 바인딩
const fn = person.greet;
fn(); // undefined (기본 바인딩)
```

**암시적 바인딩이 있으면 기본 바인딩보다 우선하지만, 참조를 잃으면 기본 바인딩으로 돌아갑니다.**

### 우선순위 결정 플로우차트

```
함수 호출 발견
    ↓
화살표 함수인가?
    ├─ Yes → 렉시컬 스코프의 this 사용 (변경 불가)
    └─ No
        ↓
    new와 함께 호출?
        ├─ Yes → 새로 생성된 객체가 this
        └─ No
            ↓
        call/apply/bind 사용?
            ├─ Yes → 명시적으로 지정한 객체가 this
            └─ No
                ↓
            객체.메소드() 형태?
                ├─ Yes → 점(.) 앞의 객체가 this
                └─ No
                    ↓
                기본 바인딩 (전역 객체 또는 undefined)
```

### 실전 예제: 모든 규칙 적용

```javascript
function identify() {
  return this.name;
}

const obj1 = { name: 'obj1' };
const obj2 = { name: 'obj2' };

// 1. 기본 바인딩
identify(); // undefined

// 2. 암시적 바인딩
obj1.identify = identify;
obj1.identify(); // "obj1"

// 3. 명시적 바인딩 (암시적보다 우선)
obj1.identify.call(obj2); // "obj2"

// 4. bind (명시적 바인딩)
const boundIdentify = identify.bind(obj1);
boundIdentify(); // "obj1"
boundIdentify.call(obj2); // 여전히 "obj1" (bind가 고정)

// 5. new 바인딩 (bind보다 우선)
function Person(name) {
  this.name = name;
}
const BoundPerson = Person.bind(obj1);
const person = new BoundPerson('person');
console.log(person.name); // "person" (new가 우선)
console.log(obj1.name);   // undefined (obj1 영향 없음)
```

## 함정과 주의사항

### 1. 중첩 함수에서 this 손실

```javascript
const counter = {
  count: 0,
  increment() {
    console.log(this); // counter ✅

    function addOne() {
      console.log(this); // undefined ❌
      this.count++; // 에러!
    }

    addOne();
  }
};

counter.increment();
```

**왜 이런 일이?**

`addOne()`은 독립 함수 호출이므로 기본 바인딩이 적용됩니다.

**해결책:**

```javascript
// 방법 1: 화살표 함수
increment() {
  const addOne = () => {
    this.count++; // ✅
  };
  addOne();
}

// 방법 2: that 패턴
increment() {
  const that = this;
  function addOne() {
    that.count++; // ✅
  }
  addOne();
}

// 방법 3: bind
increment() {
  function addOne() {
    this.count++; // ✅
  }
  addOne.call(this);
}
```

### 2. setTimeout/setInterval에서 this 손실

```javascript
class Timer {
  constructor() {
    this.seconds = 0;
  }

  start() {
    setTimeout(function() {
      console.log(this); // undefined ❌
      this.seconds++;
    }, 1000);
  }
}
```

**해결책:**

```javascript
// 방법 1: 화살표 함수 (권장)
start() {
  setTimeout(() => {
    this.seconds++; // ✅
  }, 1000);
}

// 방법 2: bind
start() {
  setTimeout(function() {
    this.seconds++; // ✅
  }.bind(this), 1000);
}
```

### 3. 이벤트 핸들러에서 this

```javascript
class Button {
  constructor() {
    this.clickCount = 0;
  }

  handleClick() {
    this.clickCount++;
    console.log(this.clickCount);
  }

  attachTo(element) {
    element.addEventListener('click', this.handleClick); // ❌
  }
}

const btn = new Button();
btn.attachTo(document.querySelector('#myButton'));
// 클릭하면 에러!
```

**문제:** 이벤트 리스너는 `this.handleClick()`이 아니라 `handleClick()` 형태로 호출합니다.

**해결책:**

```javascript
// 방법 1: bind
attachTo(element) {
  element.addEventListener('click', this.handleClick.bind(this)); // ✅
}

// 방법 2: 화살표 함수
attachTo(element) {
  element.addEventListener('click', () => this.handleClick()); // ✅
}

// 방법 3: 생성자에서 bind
constructor() {
  this.clickCount = 0;
  this.handleClick = this.handleClick.bind(this); // ✅
}
```

### 4. 배열 메소드에서 this 손실

```javascript
const multiplier = {
  factor: 2,
  multiply(numbers) {
    return numbers.map(function(n) {
      return n * this.factor; // undefined! ❌
    });
  }
};

multiplier.multiply([1, 2, 3]); // [NaN, NaN, NaN]
```

**해결책:**

```javascript
// 방법 1: 화살표 함수 (권장)
multiply(numbers) {
  return numbers.map(n => n * this.factor); // ✅
}

// 방법 2: thisArg 매개변수 활용
multiply(numbers) {
  return numbers.map(function(n) {
    return n * this.factor; // ✅
  }, this); // 두 번째 인자로 this 전달
}

// 방법 3: bind
multiply(numbers) {
  return numbers.map(function(n) {
    return n * this.factor; // ✅
  }.bind(this));
}
```

### 5. 메소드를 변수에 할당

```javascript
const person = {
  name: '홍길동',
  greet() {
    console.log(`안녕하세요, ${this.name}입니다.`);
  }
};

// ❌ 참조 손실
const greet = person.greet;
greet(); // "안녕하세요, undefined입니다."

// ❌ 배열에 넣어도 손실
const methods = [person.greet];
methods[0](); // "안녕하세요, undefined입니다."

// ❌ 구조 분해 할당도 손실
const { greet: greetFn } = person;
greetFn(); // "안녕하세요, undefined입니다."
```

**해결책:**

```javascript
// 방법 1: bind 사용
const greet = person.greet.bind(person); // ✅
greet(); // "안녕하세요, 홍길동입니다."

// 방법 2: 화살표 함수로 래핑
const greet = () => person.greet(); // ✅

// 방법 3: 객체 메소드를 화살표 함수로 정의
const person = {
  name: '홍길동',
  greet: function() {
    return () => {
      console.log(`안녕하세요, ${this.name}입니다.`);
    };
  }
};

const greet = person.greet(); // ✅
greet(); // "안녕하세요, 홍길동입니다."
```

### 6. React에서 흔한 실수

```javascript
// ❌ 나쁜 예: 렌더링마다 새 함수 생성 (성능 이슈)
class MyComponent extends React.Component {
  handleClick() {
    console.log(this.props);
  }

  render() {
    return (
      <button onClick={this.handleClick.bind(this)}>
        클릭
      </button>
    );
  }
}

// ❌ 나쁜 예: 인라인 화살표 함수 (성능 이슈)
render() {
  return (
    <button onClick={() => this.handleClick()}>
      클릭
    </button>
  );
}
```

렌더링할 때마다 새로운 함수를 생성하므로 **자식 컴포넌트가 불필요하게 리렌더링**됩니다.

**해결책:**

```javascript
// ✅ 좋은 예 1: 생성자에서 bind
class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    console.log(this.props);
  }

  render() {
    return <button onClick={this.handleClick}>클릭</button>;
  }
}

// ✅ 좋은 예 2: 클래스 필드 (화살표 함수)
class MyComponent extends React.Component {
  handleClick = () => {
    console.log(this.props);
  }

  render() {
    return <button onClick={this.handleClick}>클릭</button>;
  }
}
```

### 7. 메소드 체이닝에서 this

```javascript
class Calculator {
  constructor() {
    this.value = 0;
  }

  add(num) {
    this.value += num;
    // return this를 잊으면 체이닝 불가!
  }

  multiply(num) {
    this.value *= num;
    return this; // ✅
  }
}

const calc = new Calculator();
calc.add(5).multiply(2); // ❌ 에러! add가 undefined 반환
```

**해결책:**

```javascript
class Calculator {
  constructor() {
    this.value = 0;
  }

  add(num) {
    this.value += num;
    return this; // ✅ this를 반환
  }

  multiply(num) {
    this.value *= num;
    return this; // ✅
  }

  getValue() {
    return this.value;
  }
}

const result = new Calculator()
  .add(5)
  .multiply(2)
  .add(10)
  .getValue(); // 20
```

## 실전에서 활용하기

### 1. React 클래스 컴포넌트

```javascript
class TodoList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      todos: [],
      inputValue: ''
    };

    // 생성자에서 한 번만 bind (성능 최적화)
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleInputChange(e) {
    this.setState({ inputValue: e.target.value });
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({
      todos: [...this.state.todos, this.state.inputValue],
      inputValue: ''
    });
  }

  handleDelete(index) {
    this.setState({
      todos: this.state.todos.filter((_, i) => i !== index)
    });
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <input
            value={this.state.inputValue}
            onChange={this.handleInputChange}
          />
          <button type="submit">추가</button>
        </form>

        <ul>
          {this.state.todos.map((todo, index) => (
            <li key={index}>
              {todo}
              <button onClick={() => this.handleDelete(index)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
```

**또는 클래스 필드 사용 (더 현대적):**

```javascript
class TodoList extends React.Component {
  state = {
    todos: [],
    inputValue: ''
  };

  // 화살표 함수로 자동 바인딩
  handleInputChange = (e) => {
    this.setState({ inputValue: e.target.value });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.setState({
      todos: [...this.state.todos, this.state.inputValue],
      inputValue: ''
    });
  }

  handleDelete = (index) => {
    this.setState({
      todos: this.state.todos.filter((_, i) => i !== index)
    });
  }

  render() {
    // ... 동일
  }
}
```

### 2. 이벤트 리스너

```javascript
class ImageGallery {
  constructor(container) {
    this.container = container;
    this.images = [];
    this.currentIndex = 0;

    // DOM 요소
    this.prevBtn = container.querySelector('.prev');
    this.nextBtn = container.querySelector('.next');
    this.imageElement = container.querySelector('.current-image');

    // 이벤트 리스너 등록 (bind 필수!)
    this.prevBtn.addEventListener('click', this.showPrev.bind(this));
    this.nextBtn.addEventListener('click', this.showNext.bind(this));

    // 또는 화살표 함수로
    // this.prevBtn.addEventListener('click', () => this.showPrev());
    // this.nextBtn.addEventListener('click', () => this.showNext());
  }

  loadImages(urls) {
    this.images = urls;
    this.render();
  }

  showPrev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.render();
  }

  showNext() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.render();
  }

  render() {
    if (this.images.length > 0) {
      this.imageElement.src = this.images[this.currentIndex];
    }
  }
}

// 사용
const gallery = new ImageGallery(document.querySelector('#gallery'));
gallery.loadImages(['/img1.jpg', '/img2.jpg', '/img3.jpg']);
```

### 3. API 클라이언트

```javascript
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = null;

    // 모든 메소드를 bind하여 독립적으로 사용 가능하게
    this.get = this.get.bind(this);
    this.post = this.post.bind(this);
    this.put = this.put.bind(this);
    this.delete = this.delete.bind(this);
  }

  setToken(token) {
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// 사용
const api = new APIClient('https://api.example.com');
api.setToken('user-token-123');

// 메소드를 독립적으로 전달 가능 (bind 덕분)
const fetchUser = api.get;
fetchUser('/users/1')
  .then(user => console.log(user))
  .catch(error => console.error(error));
```

### 4. 비동기 패턴

```javascript
class DataLoader {
  constructor() {
    this.cache = new Map();
    this.loading = new Set();
  }

  async loadData(key) {
    // 캐시 확인
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // 이미 로딩 중이면 대기
    if (this.loading.has(key)) {
      return this.waitForLoading(key);
    }

    // 새로운 데이터 로드
    this.loading.add(key);

    try {
      const data = await fetch(`/api/data/${key}`)
        .then(res => res.json())
        .then(data => {
          // 화살표 함수 덕분에 this가 DataLoader를 가리킴
          this.cache.set(key, data);
          return data;
        });

      return data;
    } finally {
      this.loading.delete(key);
    }
  }

  async waitForLoading(key) {
    // 간단한 폴링 방식
    while (this.loading.has(key)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.cache.get(key);
  }

  clearCache() {
    this.cache.clear();
  }
}

// 사용
const loader = new DataLoader();

// 동시에 같은 데이터 요청 (중복 방지)
Promise.all([
  loader.loadData('user-1'),
  loader.loadData('user-1'),
  loader.loadData('user-1')
]).then(([user1, user2, user3]) => {
  // 실제로는 한 번만 API 호출됨
  console.log('모두 같은 객체:', user1 === user2 && user2 === user3);
});
```

### 5. 디바운스/쓰로틀

```javascript
class SearchBox {
  constructor(inputElement) {
    this.input = inputElement;
    this.results = [];
    this.abortController = null;

    // 디바운스된 검색 함수 생성 (this 바인딩 중요!)
    this.debouncedSearch = this.debounce(this.search.bind(this), 300);

    // 이벤트 리스너 등록
    this.input.addEventListener('input', (e) => {
      this.debouncedSearch(e.target.value);
    });
  }

  debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  async search(query) {
    // 이전 요청 취소
    if (this.abortController) {
      this.abortController.abort();
    }

    if (!query.trim()) {
      this.results = [];
      this.render();
      return;
    }

    this.abortController = new AbortController();

    try {
      const response = await fetch(`/api/search?q=${query}`, {
        signal: this.abortController.signal
      });

      const data = await response.json();
      this.results = data.results;
      this.render();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('검색 실패:', error);
      }
    }
  }

  render() {
    // 결과 렌더링 로직
    console.log('검색 결과:', this.results);
  }
}

// 사용
const searchBox = new SearchBox(document.querySelector('#search-input'));
```

### 6. 옵저버 패턴

```javascript
class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(handler);

    // 체이닝을 위해 this 반환
    return this;
  }

  off(event, handler) {
    if (!this.events.has(event)) return this;

    const handlers = this.events.get(event);
    const index = handlers.indexOf(handler);

    if (index !== -1) {
      handlers.splice(index, 1);
    }

    return this;
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return this;

    const handlers = this.events.get(event);
    handlers.forEach(handler => {
      // 각 핸들러는 자신의 컨텍스트 유지
      handler.apply(handler, args);
    });

    return this;
  }
}

class Store extends EventEmitter {
  constructor() {
    super();
    this.state = {};
  }

  setState(newState) {
    const prevState = this.state;
    this.state = { ...this.state, ...newState };

    // 상태 변경 이벤트 발생
    this.emit('change', this.state, prevState);
  }

  getState() {
    return this.state;
  }
}

// 사용
const store = new Store();

// 리스너 등록 (this 바인딩 주의!)
class Counter {
  constructor(store) {
    this.store = store;
    this.count = 0;

    // bind 사용
    this.store.on('change', this.handleChange.bind(this));

    // 또는 화살표 함수
    // this.store.on('change', (state) => this.handleChange(state));
  }

  handleChange(state) {
    console.log('상태 변경됨:', state);
    console.log('현재 count:', this.count);
  }

  increment() {
    this.count++;
    this.store.setState({ count: this.count });
  }
}

const counter = new Counter(store);
counter.increment();
```

### 7. 메소드 차용 (Method Borrowing)

```javascript
// 배열 메소드를 유사 배열 객체에 사용
function processArguments() {
  // arguments는 배열이 아니지만 배열 메소드 사용 가능
  const args = Array.prototype.slice.call(arguments);

  console.log('인자 개수:', args.length);

  // 배열 메소드 사용
  const doubled = args.map(x => x * 2);
  console.log('2배:', doubled);
}

processArguments(1, 2, 3, 4, 5);

// 현대적 방법: spread 연산자
function processArgumentsModern(...args) {
  console.log('인자 개수:', args.length);
  const doubled = args.map(x => x * 2);
  console.log('2배:', doubled);
}

// NodeList를 배열로 변환
const divs = document.querySelectorAll('div');

// 방법 1: Array.from (현대적)
const divArray1 = Array.from(divs);

// 방법 2: spread (현대적)
const divArray2 = [...divs];

// 방법 3: slice.call (구식이지만 여전히 유효)
const divArray3 = Array.prototype.slice.call(divs);

// 배열 메소드를 다른 객체에 빌림
const obj = {
  0: 'a',
  1: 'b',
  2: 'c',
  length: 3
};

// forEach 빌려쓰기
Array.prototype.forEach.call(obj, (item, index) => {
  console.log(`${index}: ${item}`);
});

// map 빌려쓰기
const upperCased = Array.prototype.map.call(obj, item => item.toUpperCase());
console.log(upperCased); // ['A', 'B', 'C']
```

## 참고 자료

### MDN 공식 문서

- [this](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Operators/this) - JavaScript의 this 키워드 상세 설명
- [Arrow functions](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/Arrow_functions) - 화살표 함수와 렉시컬 this
- [Function.prototype.bind()](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) - bind 메소드
- [Function.prototype.call()](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Function/call) - call 메소드
- [Function.prototype.apply()](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Function/apply) - apply 메소드
- [Strict mode](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Strict_mode) - strict mode에서의 this

### JavaScript 심화 학습

- [You Don't Know JS: this & Object Prototypes](https://github.com/getify/You-Dont-Know-JS/tree/1st-ed/this%20%26%20object%20prototypes) - Kyle Simpson의 this에 대한 깊이 있는 설명
- [JavaScript.info: Object methods, "this"](https://javascript.info/object-methods) - 객체 메소드와 this
- [JavaScript.info: Function binding](https://javascript.info/bind) - 함수 바인딩 심화
- [Exploring JS: this](https://exploringjs.com/impatient-js/ch_this.html) - Dr. Axel Rauschmayer의 this 가이드

### React 관련

- [Handling Events - React Docs](https://react.dev/learn/responding-to-events) - React에서 이벤트 처리와 this
- [Why arrow functions and bind in React's render are problematic](https://medium.freecodecamp.org/why-arrow-functions-and-bind-in-reacts-render-are-problematic-f1c08b060e36) - 성능 최적화

### 블로그 글

- [Understanding JavaScript's "this" keyword](https://www.digitalocean.com/community/conceptual_articles/understanding-this-bind-call-and-apply-in-javascript) - DigitalOcean
- [The Simple Rules to 'this' in JavaScript](https://codeburst.io/the-simple-rules-to-this-in-javascript-35d97f31bde3) - Tyler McGinnis
- [Gentle explanation of 'this' in JavaScript](https://dmitripavlutin.com/gentle-explanation-of-this-in-javascript/) - Dmitri Pavlutin

### 관련 문서

- [bind.md](/Users/b/personal/learn-cs/languages/javascript/bind.md) - bind() 메소드 상세 가이드
- [callback.md](/Users/b/personal/learn-cs/languages/javascript/callback.md) - 콜백 함수와 this
- [closure.md](/Users/b/personal/learn-cs/languages/javascript/closure.md) - 클로저와 this의 관계
- [prototype.md](/Users/b/personal/learn-cs/languages/javascript/prototype.md) - 프로토타입과 this

### 연습 문제

this를 제대로 이해했는지 확인하고 싶다면 다음 문제들을 풀어보세요:

1. **기본 규칙 테스트**: 각 호출의 this가 무엇인지 예측하기
2. **디버깅**: this 관련 버그가 있는 코드 고치기
3. **리팩토링**: 구식 this 패턴을 화살표 함수로 변환하기
4. **설계**: this를 올바르게 사용하는 클래스 설계하기

---

**마지막 조언**

JavaScript의 `this`는 처음에는 혼란스럽지만, 4가지 바인딩 규칙과 우선순위만 이해하면 충분히 예측 가능합니다:

1. **화살표 함수**인가? → 렉시컬 스코프
2. **new**와 함께? → 새 객체
3. **call/apply/bind**? → 명시된 객체
4. **객체.메소드()**? → 객체
5. 그 외 → 전역 객체 또는 undefined

실수를 두려워하지 마세요. 저도 수없이 많은 `undefined.setState` 에러를 보며 배웠습니다. 디버깅하면서 "아, 여기서 this가 사라졌구나!"를 깨닫는 순간이 쌓이면, 어느새 this를 자유자재로 다루게 될 것입니다.

Happy coding!
