---
title: Prototype Chain - JavaScript 상속의 마법 같은 여정
date: 2025-10-13
layout: page
---

# Prototype Chain - JavaScript 상속의 마법 같은 여정

[prototype.md](./prototype.md)를 읽고 오셨나요? 그렇다면 이미 Prototype이 무엇이고, 왜 중요한지 알고 계실 겁니다. 하지만 **Prototype Chain**은 또 다른 차원의 이야기입니다.

저는 한번은 이런 디버깅 상황에 직면한 적이 있습니다:

```javascript
const dog = new Dog('뽀삐');
dog.toString(); // "[object Object]"

// 어? Dog에는 toString 메소드가 없는데?
console.log(Dog.prototype.hasOwnProperty('toString')); // false
// 그런데 어떻게 dog.toString()이 작동하지?
```

이 질문의 답이 바로 **Prototype Chain**입니다. JavaScript는 마치 **탐정처럼** 속성을 찾아 여러 단계를 거쳐 올라갑니다. 이 문서에서는 그 신비로운 여정을 함께 따라가보겠습니다.

## 목차

- [왜 Prototype Chain을 이해해야 할까요?](#왜-prototype-chain을-이해해야-할까요)
- [Chain이라는 단어가 무엇을 의미할까요?](#chain이라는-단어가-무엇을-의미할까요)
- [Prototype Chain의 동작 원리](#prototype-chain의-동작-원리)
- [시각적으로 Chain 탐색하기](#시각적으로-chain-탐색하기)
- [실전 예제: Chain 따라 올라가기](#실전-예제-chain-따라-올라가기)
- [instanceof와 Prototype Chain](#instanceof와-prototype-chain)
- [상속과 Prototype Chain](#상속과-prototype-chain)
- [함정과 주의사항](#함정과-주의사항)
- [성능 고려사항](#성능-고려사항)
- [실전 디버깅 팁](#실전-디버깅-팁)
- [결론: Chain을 마스터하기](#결론-chain을-마스터하기)
- [참고 자료](#참고-자료)

## 왜 Prototype Chain을 이해해야 할까요?

### 1. 상속의 비밀을 알 수 있습니다

JavaScript의 상속은 클래스 기반 언어(Java, C++)와 완전히 다릅니다. Java에서는 "복사"가 일어나지만, JavaScript에서는 **"연결(Link)"**이 일어납니다.

```javascript
// Java식 사고 (복사)
class Animal {
  void eat() { ... }
}

class Dog extends Animal {
  // eat()이 복사됨
}

// JavaScript의 실제 동작 (연결)
function Animal() {}
Animal.prototype.eat = function() { ... };

function Dog() {}
Dog.prototype = Object.create(Animal.prototype);

const dog = new Dog();
// dog는 eat을 가지고 있지 않습니다!
// 하지만 Chain을 통해 Animal.prototype.eat에 접근합니다
```

이 차이를 모르면 JavaScript의 상속을 절대 이해할 수 없습니다.

### 2. 디버깅이 훨씬 쉬워집니다

실무에서 이런 에러를 본 적이 있나요?

```javascript
const user = {
  name: 'John',
  age: 30
};

user.toString(); // ✅ 작동함

const data = Object.create(null);
data.name = 'Jane';
data.age = 25;

data.toString(); // ❌ TypeError: data.toString is not a function
```

"둘 다 객체인데 왜 하나는 작동하고 하나는 안 되지?" 이런 의문이 들었다면, 바로 Prototype Chain을 이해해야 할 때입니다.

**답:**
```
user의 Chain:
user → Object.prototype (toString이 여기 있음!) → null

data의 Chain:
data → null (toString이 없음!)
```

### 3. `instanceof`가 어떻게 동작하는지 알 수 있습니다

```javascript
function Animal() {}
function Dog() {}
Dog.prototype = Object.create(Animal.prototype);

const myDog = new Dog();

console.log(myDog instanceof Dog);      // true
console.log(myDog instanceof Animal);   // true
console.log(myDog instanceof Object);   // true

// 어떻게 myDog가 Animal과 Object의 인스턴스일까?
// 답은 Prototype Chain에 있습니다!
```

### 4. 성능 최적화를 할 수 있습니다

```javascript
// ❌ 성능 문제가 있는 코드
function A() {}
function B() {}
function C() {}
function D() {}
function E() {}

B.prototype = Object.create(A.prototype);
C.prototype = Object.create(B.prototype);
D.prototype = Object.create(C.prototype);
E.prototype = Object.create(D.prototype);

E.prototype.deepMethod = function() {
  // 이 메소드에 접근할 때마다 5단계를 거쳐야 함!
};

const e = new E();
// 반복문에서 수천 번 호출
for (let i = 0; i < 10000; i++) {
  e.deepMethod(); // 매번 5단계 탐색... 느림!
}
```

Prototype Chain을 이해하면 이런 성능 병목을 발견하고 최적화할 수 있습니다.

## Chain이라는 단어가 무엇을 의미할까요?

**Chain(사슬)**이라는 단어에서 알 수 있듯이, 이것은 **연결된 고리들**입니다.

### 비유로 이해하기

집에서 리모컨을 찾는다고 상상해보세요:

1. 먼저 **내 주머니**를 확인합니다 → 없음
2. 그 다음 **거실 테이블**을 확인합니다 → 없음
3. 그 다음 **소파 쿠션 사이**를 확인합니다 → 발견! ✅

JavaScript의 Prototype Chain도 정확히 이렇게 작동합니다:

```javascript
const dog = new Dog('뽀삐');
dog.bark();

// 1. dog 객체 자체에 bark가 있나? → 없음
// 2. Dog.prototype에 bark가 있나? → 발견! ✅
// 3. 실행!
```

### 기본 Chain 구조

모든 JavaScript 객체는 (null로 끝나는) Chain을 가지고 있습니다:

```
객체 → Prototype → Prototype → ... → Object.prototype → null
```

**끝은 항상 `null`입니다.** 이것이 탐색의 종료 지점입니다.

## Prototype Chain의 동작 원리

### 속성 조회의 단계별 과정

JavaScript 엔진이 `obj.property`를 만나면 다음 알고리즘을 실행합니다:

```
1. obj 자체에 property가 있는가?
   있다면 → 반환 ✅
   없다면 → 2단계로

2. obj.__proto__에 property가 있는가?
   있다면 → 반환 ✅
   없다면 → 3단계로

3. obj.__proto__.__proto__에 property가 있는가?
   있다면 → 반환 ✅
   없다면 → 4단계로

...

N. null에 도달했는가?
   그렇다면 → undefined 반환
```

### 간단한 예제로 보기

```javascript
const obj = {
  name: 'JavaScript'
};

console.log(obj.name);        // "JavaScript"
console.log(obj.toString);    // function toString() { [native code] }
console.log(obj.nonExistent); // undefined
```

**단계별 탐색:**

```
obj.name 찾기:
├─ 1단계: obj 자체 확인
│  └─ name: "JavaScript" → 발견! ✅
└─ 반환: "JavaScript"

obj.toString 찾기:
├─ 1단계: obj 자체 확인
│  └─ toString 없음 ❌
├─ 2단계: obj.__proto__ (Object.prototype) 확인
│  └─ toString: function → 발견! ✅
└─ 반환: function

obj.nonExistent 찾기:
├─ 1단계: obj 자체 확인
│  └─ nonExistent 없음 ❌
├─ 2단계: obj.__proto__ (Object.prototype) 확인
│  └─ nonExistent 없음 ❌
├─ 3단계: Object.prototype.__proto__ (null) 확인
│  └─ 탐색 종료
└─ 반환: undefined
```

### __proto__ vs prototype 다시 보기

**혼동하기 쉬운 부분!**

```javascript
function Dog(name) {
  this.name = name;
}

Dog.prototype.bark = function() {
  console.log('멍멍!');
};

const myDog = new Dog('뽀삐');
```

**관계도:**

```
Dog (생성자 함수)
  └─ prototype ─────┐
                    ↓
myDog (인스턴스)    Dog.prototype (청사진)
  ├─ name: "뽀삐"     ├─ bark: function
  └─ __proto__ ──────┘  ├─ constructor: Dog
                        └─ __proto__ ──→ Object.prototype
```

- **`Dog.prototype`**: "청사진". 여기에 메소드를 정의합니다
- **`myDog.__proto__`**: "연결 고리". `Dog.prototype`을 가리킵니다

```javascript
console.log(myDog.__proto__ === Dog.prototype); // true
```

## 시각적으로 Chain 탐색하기

### 예제 1: 기본 객체

```javascript
const person = {
  name: '홍길동',
  age: 30
};
```

**Chain 구조:**

```
person
  ├─ name: "홍길동"
  ├─ age: 30
  └─ __proto__: Object.prototype
                  ├─ toString: function
                  ├─ hasOwnProperty: function
                  ├─ valueOf: function
                  └─ __proto__: null
```

**속성 조회 시각화:**

```javascript
person.name
  → person 자체에서 찾음 ✅
  → 반환: "홍길동"

person.toString
  → person 자체에 없음 ❌
  → person.__proto__ (Object.prototype)에서 찾음 ✅
  → 반환: function toString()

person.fly
  → person 자체에 없음 ❌
  → Object.prototype에 없음 ❌
  → null 도달
  → 반환: undefined
```

### 예제 2: 생성자 함수 사용

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.eat = function() {
  console.log(`${this.name}이 먹이를 먹습니다.`);
};

Animal.prototype.sleep = function() {
  console.log(`${this.name}이 잠을 잡니다.`);
};

const cat = new Animal('야옹이');
```

**Chain 구조:**

```
cat
  ├─ name: "야옹이"
  └─ __proto__: Animal.prototype
                  ├─ eat: function
                  ├─ sleep: function
                  ├─ constructor: Animal
                  └─ __proto__: Object.prototype
                                  ├─ toString: function
                                  ├─ hasOwnProperty: function
                                  └─ __proto__: null
```

**실제 탐색:**

```javascript
// 1단계 탐색
cat.name
  ├─ cat에서 찾음 ✅
  └─ "야옹이"

// 2단계 탐색
cat.eat()
  ├─ cat에 없음 ❌
  ├─ Animal.prototype에서 찾음 ✅
  └─ 실행: "야옹이이 먹이를 먹습니다."

// 3단계 탐색
cat.toString()
  ├─ cat에 없음 ❌
  ├─ Animal.prototype에 없음 ❌
  ├─ Object.prototype에서 찾음 ✅
  └─ 실행: "[object Object]"
```

### 예제 3: 상속 구조

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.eat = function() {
  console.log(`${this.name}이 먹습니다.`);
};

function Dog(name, breed) {
  Animal.call(this, name);
  this.breed = breed;
}

Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function() {
  console.log(`${this.name}: 멍멍!`);
};

const myDog = new Dog('뽀삐', '푸들');
```

**완전한 Chain 구조:**

```
myDog
  ├─ name: "뽀삐"
  ├─ breed: "푸들"
  └─ __proto__: Dog.prototype
                  ├─ bark: function
                  ├─ constructor: Dog
                  └─ __proto__: Animal.prototype
                                  ├─ eat: function
                                  ├─ constructor: Animal
                                  └─ __proto__: Object.prototype
                                                  ├─ toString: function
                                                  ├─ hasOwnProperty: function
                                                  ├─ valueOf: function
                                                  └─ __proto__: null
```

**4단계 Chain 탐색:**

```javascript
myDog.name
  단계 1: myDog ✅
  → "뽀삐"

myDog.bark()
  단계 1: myDog ❌
  단계 2: Dog.prototype ✅
  → "뽀삐: 멍멍!"

myDog.eat()
  단계 1: myDog ❌
  단계 2: Dog.prototype ❌
  단계 3: Animal.prototype ✅
  → "뽀삐이 먹습니다."

myDog.toString()
  단계 1: myDog ❌
  단계 2: Dog.prototype ❌
  단계 3: Animal.prototype ❌
  단계 4: Object.prototype ✅
  → "[object Object]"

myDog.fly()
  단계 1: myDog ❌
  단계 2: Dog.prototype ❌
  단계 3: Animal.prototype ❌
  단계 4: Object.prototype ❌
  단계 5: null → undefined
  → TypeError: myDog.fly is not a function
```

## 실전 예제: Chain 따라 올라가기

### 예제 1: 메소드 조회 과정 직접 확인하기

```javascript
function Vehicle(type) {
  this.type = type;
}

Vehicle.prototype.start = function() {
  console.log(`${this.type}이 출발합니다.`);
};

function Car(brand, model) {
  Vehicle.call(this, 'Car');
  this.brand = brand;
  this.model = model;
}

Car.prototype = Object.create(Vehicle.prototype);
Car.prototype.constructor = Car;

Car.prototype.drive = function() {
  console.log(`${this.brand} ${this.model}이 달립니다.`);
};

const myCar = new Car('Tesla', 'Model 3');
```

**직접 Chain 탐색해보기:**

```javascript
// 수동으로 Chain을 따라가며 메소드 찾기
function findInChain(obj, property) {
  let current = obj;
  let depth = 0;

  while (current !== null) {
    console.log(`단계 ${depth}:`, current.constructor?.name || 'Object.prototype');

    if (current.hasOwnProperty(property)) {
      console.log(`  → ${property} 발견! ✅`);
      return current[property];
    }

    console.log(`  → ${property} 없음 ❌`);
    current = Object.getPrototypeOf(current);
    depth++;
  }

  console.log(`  → Chain 끝 (null). undefined 반환`);
  return undefined;
}

// 테스트
console.log('\n=== brand 찾기 ===');
findInChain(myCar, 'brand');
// 단계 0: Car
//   → brand 발견! ✅

console.log('\n=== drive 찾기 ===');
findInChain(myCar, 'drive');
// 단계 0: Car
//   → drive 없음 ❌
// 단계 1: Car
//   → drive 발견! ✅

console.log('\n=== start 찾기 ===');
findInChain(myCar, 'start');
// 단계 0: Car
//   → start 없음 ❌
// 단계 1: Car
//   → start 없음 ❌
// 단계 2: Vehicle
//   → start 발견! ✅

console.log('\n=== toString 찾기 ===');
findInChain(myCar, 'toString');
// 단계 0: Car
//   → toString 없음 ❌
// 단계 1: Car
//   → toString 없음 ❌
// 단계 2: Vehicle
//   → toString 없음 ❌
// 단계 3: Object.prototype
//   → toString 발견! ✅
```

### 예제 2: 속성 가리기 (Shadowing) 이해하기

**Shadowing**은 하위 객체가 상위 Prototype의 속성을 "그림자"로 가리는 현상입니다.

```javascript
function Animal() {}
Animal.prototype.sound = 'Some sound';
Animal.prototype.legs = 4;

const dog = new Animal();
console.log(dog.sound); // "Some sound"
console.log(dog.legs);  // 4

// dog에 자신만의 sound 추가
dog.sound = '멍멍!';
console.log(dog.sound); // "멍멍!" ← 자신의 속성이 우선!

// 하지만 Prototype은 변하지 않음
const cat = new Animal();
console.log(cat.sound); // "Some sound" ← 여전히 Prototype 값
```

**시각화:**

```
// dog.sound = '멍멍!' 이전
dog
  └─ __proto__: Animal.prototype
                  └─ sound: "Some sound"

dog.sound 조회
  → Animal.prototype.sound → "Some sound"


// dog.sound = '멍멍!' 이후
dog
  ├─ sound: "멍멍!" ⬅ 이것이 우선! (Shadowing)
  └─ __proto__: Animal.prototype
                  └─ sound: "Some sound" ⬅ 가려짐

dog.sound 조회
  → dog.sound → "멍멍!"
```

**주의: 가려진 Prototype 속성에 접근하기**

```javascript
const dog = new Animal();
dog.sound = '멍멍!';

// 자신의 속성
console.log(dog.sound); // "멍멍!"

// Prototype의 속성 (가려진 것)
console.log(Object.getPrototypeOf(dog).sound); // "Some sound"
console.log(dog.__proto__.sound); // "Some sound"
```

### 예제 3: 메소드 오버라이딩

```javascript
function Shape() {}

Shape.prototype.draw = function() {
  return 'Drawing a shape';
};

Shape.prototype.area = function() {
  return 0;
};

function Circle(radius) {
  this.radius = radius;
}

Circle.prototype = Object.create(Shape.prototype);
Circle.prototype.constructor = Circle;

// 부모 메소드 오버라이드
Circle.prototype.draw = function() {
  return `Drawing a circle with radius ${this.radius}`;
};

Circle.prototype.area = function() {
  return Math.PI * this.radius * this.radius;
};

const circle = new Circle(5);

console.log(circle.draw()); // "Drawing a circle with radius 5"
console.log(circle.area()); // 78.53981633974483
```

**Chain 구조와 오버라이드:**

```
circle
  ├─ radius: 5
  └─ __proto__: Circle.prototype
                  ├─ draw: function ⬅ 이것이 먼저 발견됨!
                  ├─ area: function ⬅ 이것이 먼저 발견됨!
                  ├─ constructor: Circle
                  └─ __proto__: Shape.prototype
                                  ├─ draw: function ⬅ 도달하지 못함 (가려짐)
                                  ├─ area: function ⬅ 도달하지 못함 (가려짐)
                                  └─ __proto__: Object.prototype
```

**부모 메소드 호출하기 (Super 패턴):**

```javascript
Circle.prototype.draw = function() {
  // 부모의 draw 호출
  const parentDraw = Shape.prototype.draw.call(this);
  return `${parentDraw} (actually a circle with radius ${this.radius})`;
};

console.log(circle.draw());
// "Drawing a shape (actually a circle with radius 5)"
```

### 예제 4: 배열의 Prototype Chain

배열도 Prototype Chain을 가지고 있습니다!

```javascript
const arr = [1, 2, 3];
```

**Chain 구조:**

```
arr
  ├─ 0: 1
  ├─ 1: 2
  ├─ 2: 3
  ├─ length: 3
  └─ __proto__: Array.prototype
                  ├─ push: function
                  ├─ pop: function
                  ├─ map: function
                  ├─ filter: function
                  ├─ ... (50+ 메소드)
                  └─ __proto__: Object.prototype
                                  ├─ toString: function
                                  ├─ hasOwnProperty: function
                                  └─ __proto__: null
```

**그래서 이런 게 가능합니다:**

```javascript
arr.push(4);          // Array.prototype.push
arr.map(x => x * 2);  // Array.prototype.map
arr.toString();       // Array.prototype.toString (Object.prototype을 오버라이드)
arr.hasOwnProperty(0); // Object.prototype.hasOwnProperty

// 직접 확인
console.log(arr.__proto__ === Array.prototype); // true
console.log(arr.__proto__.__proto__ === Object.prototype); // true
console.log(arr.__proto__.__proto__.__proto__ === null); // true
```

### 예제 5: 함수의 Prototype Chain

함수도 객체이므로 Chain을 가지고 있습니다!

```javascript
function myFunc() {
  console.log('Hello');
}
```

**Chain 구조:**

```
myFunc
  ├─ name: "myFunc"
  ├─ length: 0
  ├─ prototype: {...}
  └─ __proto__: Function.prototype
                  ├─ call: function
                  ├─ apply: function
                  ├─ bind: function
                  └─ __proto__: Object.prototype
                                  ├─ toString: function
                                  └─ __proto__: null
```

**그래서 이런 게 가능합니다:**

```javascript
myFunc.call();   // Function.prototype.call
myFunc.apply();  // Function.prototype.apply
myFunc.bind();   // Function.prototype.bind

console.log(myFunc.__proto__ === Function.prototype); // true
console.log(myFunc.__proto__.__proto__ === Object.prototype); // true
```

### 예제 6: null Prototype 객체

`Object.create(null)`로 만든 객체는 Chain이 없습니다!

```javascript
const normalObj = {};
const nullProtoObj = Object.create(null);
```

**Chain 비교:**

```
normalObj
  └─ __proto__: Object.prototype
                  ├─ toString: function
                  ├─ hasOwnProperty: function
                  └─ __proto__: null

nullProtoObj
  └─ __proto__: null ⬅ 바로 null!
```

**실제 차이:**

```javascript
// normalObj는 Object.prototype의 메소드를 사용 가능
console.log(normalObj.toString());        // "[object Object]"
console.log(normalObj.hasOwnProperty);    // function

// nullProtoObj는 아무것도 없음
console.log(nullProtoObj.toString);       // undefined
console.log(nullProtoObj.hasOwnProperty); // undefined

// 메소드 호출 시도
normalObj.toString();      // ✅ 작동
nullProtoObj.toString();   // ❌ TypeError
```

**언제 사용할까?**

```javascript
// ✅ 순수한 데이터 저장소로 사용 (Hash Map)
const dict = Object.create(null);
dict.toString = 'some value';  // 충돌 없음!
dict.hasOwnProperty = 'another value';  // 충돌 없음!

// 일반 객체라면 문제가 됨
const normalDict = {};
normalDict.toString = 'value';  // 메소드를 덮어씀!
normalDict.toString();  // ❌ TypeError: normalDict.toString is not a function
```

## instanceof와 Prototype Chain

`instanceof` 연산자는 **Prototype Chain을 검사**합니다!

### instanceof의 동작 원리

```javascript
obj instanceof Constructor
```

이것은 다음을 확인합니다:

> "Constructor.prototype이 obj의 Prototype Chain 어딘가에 있는가?"

```javascript
function Animal() {}
function Dog() {}
Dog.prototype = Object.create(Animal.prototype);

const myDog = new Dog();
```

**Chain 구조:**

```
myDog
  └─ __proto__: Dog.prototype ✅
                  └─ __proto__: Animal.prototype ✅
                                  └─ __proto__: Object.prototype ✅
                                                  └─ __proto__: null
```

**instanceof 확인:**

```javascript
console.log(myDog instanceof Dog);
// Dog.prototype이 Chain에 있나? ✅
// → true

console.log(myDog instanceof Animal);
// Animal.prototype이 Chain에 있나? ✅
// → true

console.log(myDog instanceof Object);
// Object.prototype이 Chain에 있나? ✅
// → true

console.log(myDog instanceof Array);
// Array.prototype이 Chain에 있나? ❌
// → false
```

### instanceof를 직접 구현하기

```javascript
function myInstanceOf(obj, Constructor) {
  // null이나 원시값은 false
  if (obj === null || typeof obj !== 'object') {
    return false;
  }

  let proto = Object.getPrototypeOf(obj);

  // Chain을 따라 올라가며 탐색
  while (proto !== null) {
    if (proto === Constructor.prototype) {
      return true;  // 발견!
    }
    proto = Object.getPrototypeOf(proto);  // 다음 단계로
  }

  return false;  // 못 찾음
}

// 테스트
console.log(myInstanceOf(myDog, Dog));     // true
console.log(myInstanceOf(myDog, Animal));  // true
console.log(myInstanceOf(myDog, Object));  // true
console.log(myInstanceOf(myDog, Array));   // false
```

**단계별 실행 추적:**

```javascript
myInstanceOf(myDog, Animal) 실행:

1. proto = myDog.__proto__ (Dog.prototype)
   proto === Animal.prototype? ❌
   다음 단계로

2. proto = Dog.prototype.__proto__ (Animal.prototype)
   proto === Animal.prototype? ✅
   return true
```

### instanceof의 함정

**함정 1: Prototype을 변경하면 instanceof도 변경됨**

```javascript
function Dog() {}
const myDog = new Dog();

console.log(myDog instanceof Dog); // true

// Prototype 변경!
Dog.prototype = {};

console.log(myDog instanceof Dog); // false! ⚠️
// myDog의 Chain에는 여전히 "옛날" Dog.prototype이 있음
```

**함정 2: 다른 window/frame의 객체**

```javascript
// iframe의 배열
const iframeArray = iframe.contentWindow.Array;
const arr = new iframeArray(1, 2, 3);

console.log(arr instanceof Array); // false! ⚠️
// 다른 window의 Array.prototype을 참조함

// 해결책: Array.isArray() 사용
console.log(Array.isArray(arr)); // true ✅
```

### isPrototypeOf - instanceof의 형제

```javascript
// instanceof: 생성자 기준
myDog instanceof Dog  // true

// isPrototypeOf: Prototype 객체 기준
Dog.prototype.isPrototypeOf(myDog)  // true
```

**모든 레벨 확인:**

```javascript
console.log(Dog.prototype.isPrototypeOf(myDog));      // true
console.log(Animal.prototype.isPrototypeOf(myDog));   // true
console.log(Object.prototype.isPrototypeOf(myDog));   // true
console.log(Array.prototype.isPrototypeOf(myDog));    // false
```

## 상속과 Prototype Chain

JavaScript의 상속은 **Chain을 연결하는 것**입니다.

### 전통적인 Prototype 상속

```javascript
function Animal(name) {
  this.name = name;
}

Animal.prototype.eat = function() {
  console.log(`${this.name}이 먹습니다.`);
};

function Dog(name, breed) {
  // 부모 생성자 호출
  Animal.call(this, name);
  this.breed = breed;
}

// ⭐ 핵심: Chain 연결!
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

Dog.prototype.bark = function() {
  console.log(`${this.name}: 멍멍!`);
};

const myDog = new Dog('뽀삐', '푸들');
```

**무엇이 일어났나?**

```
// Object.create(Animal.prototype) 전:
Dog.prototype
  └─ __proto__: Object.prototype

// Object.create(Animal.prototype) 후:
Dog.prototype
  └─ __proto__: Animal.prototype ⬅ Chain 연결!
                  └─ __proto__: Object.prototype
```

### Class 문법과 Chain

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }

  eat() {
    console.log(`${this.name}이 먹습니다.`);
  }
}

class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }

  bark() {
    console.log(`${this.name}: 멍멍!`);
  }
}

const myDog = new Dog('뽀삐', '푸들');
```

**내부적으로는 똑같은 Chain!**

```
myDog
  ├─ name: "뽀삐"
  ├─ breed: "푸들"
  └─ __proto__: Dog.prototype
                  ├─ bark: function
                  ├─ constructor: Dog
                  └─ __proto__: Animal.prototype
                                  ├─ eat: function
                                  ├─ constructor: Animal
                                  └─ __proto__: Object.prototype
```

```javascript
// 완전히 동일한 결과
console.log(myDog.__proto__ === Dog.prototype); // true
console.log(myDog.__proto__.__proto__ === Animal.prototype); // true
```

### 다중 레벨 상속

```javascript
function LivingThing() {}
LivingThing.prototype.breathe = function() {
  console.log('호흡합니다.');
};

function Animal(name) {
  this.name = name;
}
Animal.prototype = Object.create(LivingThing.prototype);
Animal.prototype.constructor = Animal;
Animal.prototype.eat = function() {
  console.log(`${this.name}이 먹습니다.`);
};

function Mammal(name) {
  Animal.call(this, name);
}
Mammal.prototype = Object.create(Animal.prototype);
Mammal.prototype.constructor = Mammal;
Mammal.prototype.feedMilk = function() {
  console.log(`${this.name}이 젖을 먹입니다.`);
};

function Dog(name, breed) {
  Mammal.call(this, name);
  this.breed = breed;
}
Dog.prototype = Object.create(Mammal.prototype);
Dog.prototype.constructor = Dog;
Dog.prototype.bark = function() {
  console.log(`${this.name}: 멍멍!`);
};

const myDog = new Dog('뽀삐', '푸들');
```

**5단계 Chain:**

```
myDog
  └─ __proto__: Dog.prototype
                  └─ __proto__: Mammal.prototype
                                  └─ __proto__: Animal.prototype
                                                  └─ __proto__: LivingThing.prototype
                                                                  └─ __proto__: Object.prototype
                                                                                  └─ __proto__: null
```

**모든 메소드 접근 가능:**

```javascript
myDog.bark();     // Dog.prototype
myDog.feedMilk(); // Mammal.prototype
myDog.eat();      // Animal.prototype
myDog.breathe();  // LivingThing.prototype
myDog.toString(); // Object.prototype

console.log(myDog instanceof Dog);          // true
console.log(myDog instanceof Mammal);       // true
console.log(myDog instanceof Animal);       // true
console.log(myDog instanceof LivingThing);  // true
console.log(myDog instanceof Object);       // true
```

### 믹스인과 Chain

Prototype Chain은 선형(linear)이므로, 다중 상속은 불가능합니다. 대신 **믹스인(Mixin)**을 사용합니다:

```javascript
// 믹스인 정의
const canSwim = {
  swim() {
    console.log(`${this.name}이 수영합니다.`);
  }
};

const canFly = {
  fly() {
    console.log(`${this.name}이 날아갑니다.`);
  }
};

// 오리는 수영도 하고 날기도 함
function Duck(name) {
  this.name = name;
}

// Mixin 적용 (Chain이 아닌 직접 복사)
Object.assign(Duck.prototype, canSwim, canFly);

Duck.prototype.quack = function() {
  console.log(`${this.name}: 꽥꽥!`);
};

const duck = new Duck('도널드');
duck.swim();  // "도널드이 수영합니다."
duck.fly();   // "도널드이 날아갑니다."
duck.quack(); // "도널드: 꽥꽥!"
```

**Mixin vs Chain:**

```
// Mixin은 복사됨:
Duck.prototype
  ├─ swim: function (복사됨)
  ├─ fly: function (복사됨)
  ├─ quack: function
  └─ __proto__: Object.prototype

// Chain은 연결됨:
Dog.prototype
  ├─ bark: function
  └─ __proto__: Animal.prototype (연결됨)
                  ├─ eat: function
                  └─ __proto__: Object.prototype
```

## 함정과 주의사항

### 함정 1: 너무 깊은 Chain

저는 한번 이런 코드를 작성한 적이 있습니다:

```javascript
// ❌ 너무 깊은 상속
BaseEntity → Model → ActiveRecord → User → AdminUser → SuperAdminUser
```

6단계나 되는 Chain! 디버깅할 때 어디서 메소드가 정의되었는지 찾기 너무 힘들었습니다.

**문제점:**
- 메소드 조회가 느림 (최악의 경우 6단계 탐색)
- 디버깅 어려움
- 변경 시 영향 범위 파악 어려움

**해결책:**
```javascript
// ✅ Composition over Inheritance
class User {
  constructor() {
    this.permissions = new PermissionManager();
    this.validator = new Validator();
    this.logger = new Logger();
  }
}

// Chain은 얕고, 기능은 조합으로!
```

### 함정 2: Prototype에 참조 타입 넣기

[prototype.md](./prototype.md)에서 배운 내용이지만, Chain 관점에서 다시 보면:

```javascript
function User() {}

// ❌ 배열을 Prototype에 직접
User.prototype.friends = [];

const user1 = new User();
const user2 = new User();

user1.friends.push('Alice');
console.log(user2.friends); // ['Alice'] ⚠️ 공유됨!
```

**Chain 관점의 설명:**

```
user1과 user2 모두:
  └─ __proto__: User.prototype
                  └─ friends: [] ⬅ 같은 배열 참조!
```

```javascript
user1.friends.push('Alice')

// user1.friends를 조회:
//   → user1 자체에 없음
//   → User.prototype.friends 찾음
//   → 그 배열에 push!

user2.friends 조회:
//   → user2 자체에 없음
//   → User.prototype.friends 찾음
//   → 같은 배열! ['Alice']
```

**해결책:**

```javascript
// ✅ 생성자에서 각 인스턴스마다 생성
function User() {
  this.friends = [];  // 각자 고유한 배열
}

const user1 = new User();
const user2 = new User();

user1.friends.push('Alice');
console.log(user2.friends); // [] ✅ 독립적!
```

### 함정 3: hasOwnProperty vs in 연산자 혼동

```javascript
function Animal() {}
Animal.prototype.species = 'Unknown';

const dog = new Animal();
dog.name = '뽀삐';
```

**hasOwnProperty: 자신의 속성만**

```javascript
console.log(dog.hasOwnProperty('name'));    // true (자신의 것)
console.log(dog.hasOwnProperty('species')); // false (Prototype의 것)
```

**in 연산자: Chain 전체 검색**

```javascript
console.log('name' in dog);     // true
console.log('species' in dog);  // true (Prototype에 있음)
console.log('toString' in dog); // true (Object.prototype에 있음)
```

**실전 예제: 객체 순회**

```javascript
// ❌ Prototype 메소드까지 순회됨
for (let key in dog) {
  console.log(key, dog[key]);
}
// name 뽀삐
// species Unknown  ⬅ 이것도 나옴!

// ✅ 자신의 속성만 순회
for (let key in dog) {
  if (dog.hasOwnProperty(key)) {
    console.log(key, dog[key]);
  }
}
// name 뽀삐

// ✅ 더 현대적: Object.keys (자동으로 자신의 것만)
Object.keys(dog).forEach(key => {
  console.log(key, dog[key]);
});
// name 뽀삐
```

### 함정 4: constructor 속성 유지 안 함

```javascript
function Animal() {}
function Dog() {}

// ❌ constructor 복원 안 함
Dog.prototype = Object.create(Animal.prototype);

const dog = new Dog();
console.log(dog.constructor === Dog);    // false ⚠️
console.log(dog.constructor === Animal); // true ⚠️
```

**왜 이런 일이?**

```
dog
  └─ __proto__: Dog.prototype
                  ├─ (constructor 없음) ❌
                  └─ __proto__: Animal.prototype
                                  └─ constructor: Animal ⬅ 여기서 찾음!
```

**해결책:**

```javascript
// ✅ constructor 복원
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

const dog = new Dog();
console.log(dog.constructor === Dog); // true ✅
```

### 함정 5: Object.create() 잘못 사용하기

```javascript
function Animal() {}
Animal.prototype.eat = function() {
  console.log('먹습니다.');
};

function Dog() {}

// ❌ 잘못된 방법들
Dog.prototype = Animal.prototype;  // 같은 객체! Dog 메소드가 Animal에도 추가됨
Dog.prototype = new Animal();      // Animal 인스턴스의 불필요한 속성까지 상속

// ✅ 올바른 방법
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
```

**차이점 시각화:**

```
// Animal.prototype을 직접 대입
Dog.prototype === Animal.prototype
  └─ 같은 객체! Dog 메소드 추가 시 Animal에도 영향

// new Animal() 사용
Dog.prototype = Animal의 인스턴스
  ├─ (Animal 생성자에서 추가된 인스턴스 속성) ⬅ 불필요!
  └─ __proto__: Animal.prototype

// Object.create(Animal.prototype) 사용 ✅
Dog.prototype = 깨끗한 새 객체
  └─ __proto__: Animal.prototype ⬅ 정확한 연결!
```

## 성능 고려사항

### 1. Chain 깊이와 조회 성능

실무에서 겪은 성능 이슈입니다. 복잡한 상속 구조에서 메소드 호출이 눈에 띄게 느려졌습니다.

```javascript
// ❌ 깊은 Chain
function A() {}
function B() {}
B.prototype = Object.create(A.prototype);
function C() {}
C.prototype = Object.create(B.prototype);
function D() {}
D.prototype = Object.create(C.prototype);
function E() {}
E.prototype = Object.create(D.prototype);

E.prototype.deepMethod = function() {
  return 'result';
};

const e = new E();

// 벤치마크
console.time('Deep Chain');
for (let i = 0; i < 1000000; i++) {
  e.deepMethod();  // 5단계 탐색
}
console.timeEnd('Deep Chain');
// Deep Chain: ~50ms
```

```javascript
// ✅ 얕은 Chain
function F() {}
F.prototype.shallowMethod = function() {
  return 'result';
};

const f = new F();

console.time('Shallow Chain');
for (let i = 0; i < 1000000; i++) {
  f.shallowMethod();  // 1단계 탐색
}
console.timeEnd('Shallow Chain');
// Shallow Chain: ~10ms ⚡ 5배 빠름!
```

**권장사항:**
- Chain을 2-3단계 이내로 유지
- 자주 호출되는 메소드는 가까운 곳에 배치
- 성능이 중요하면 Composition 고려

### 2. Prototype vs 인스턴스 메소드

```javascript
// 방법 1: Prototype 메소드 (메모리 효율적)
function User1(name) {
  this.name = name;
}
User1.prototype.greet = function() {
  console.log(`Hello, ${this.name}`);
};

// 방법 2: 인스턴스 메소드 (조회 빠름)
function User2(name) {
  this.name = name;
  this.greet = function() {
    console.log(`Hello, ${this.name}`);
  };
}

// 성능 비교
const users1 = Array.from({ length: 10000 }, (_, i) => new User1(`User${i}`));
const users2 = Array.from({ length: 10000 }, (_, i) => new User2(`User${i}`));

// 메모리: User1이 훨씬 적음
// 조회 속도: User2가 약간 빠름 (Chain 탐색 없음)

console.time('Prototype method');
users1.forEach(u => u.greet());
console.timeEnd('Prototype method');
// ~5ms

console.time('Instance method');
users2.forEach(u => u.greet());
console.timeEnd('Instance method');
// ~3ms (약간 빠름)
```

**트레이드오프:**
- **Prototype**: 메모리 효율 ⬆, 조회 약간 느림
- **인스턴스**: 메모리 사용 ⬆, 조회 빠름

**실전 조언:**
- 대부분의 경우: Prototype 사용 (메모리가 더 중요)
- 극도로 자주 호출되는 핫 패스: 인스턴스 고려
- 100개 미만의 인스턴스: 차이 무시 가능

### 3. 동적 Prototype 수정의 영향

```javascript
function MyClass() {}

// 10,000개 인스턴스 생성
const instances = Array.from({ length: 10000 }, () => new MyClass());

// 첫 호출 (최적화됨)
console.time('First call');
instances.forEach(obj => obj.newMethod && obj.newMethod());
console.timeEnd('First call');

// 런타임에 Prototype 수정
MyClass.prototype.newMethod = function() {
  return 'new';
};

// 수정 후 첫 호출 (최적화 무효화, 느림!)
console.time('After modification');
instances.forEach(obj => obj.newMethod());
console.timeEnd('After modification');

// 이후 호출 (다시 최적화됨)
console.time('Later calls');
instances.forEach(obj => obj.newMethod());
console.timeEnd('Later calls');
```

**권장사항:**
- 초기화 시점에 모든 메소드를 정의
- 런타임에 Prototype 수정하지 않기
- 불가피하다면 성능 영향을 인지하고 사용

### 4. 캐싱으로 최적화하기

```javascript
// ❌ 매번 Chain 탐색
function expensiveOperation() {
  return this.process(); // Chain을 따라 찾음
}

// ✅ 자주 사용하는 메소드를 캐싱
function OptimizedClass() {
  // 생성자에서 메소드 캐싱
  this._cachedMethod = this.process.bind(this);
}

OptimizedClass.prototype.process = function() {
  return 'result';
};

const obj = new OptimizedClass();

console.time('Without cache');
for (let i = 0; i < 1000000; i++) {
  obj.process();
}
console.timeEnd('Without cache');

console.time('With cache');
for (let i = 0; i < 1000000; i++) {
  obj._cachedMethod();
}
console.timeEnd('With cache');
```

## 실전 디버깅 팁

### 팁 1: Chain 전체 출력하기

```javascript
function printPrototypeChain(obj) {
  let current = obj;
  let depth = 0;

  console.log('=== Prototype Chain ===');

  while (current !== null) {
    const indent = '  '.repeat(depth);
    const name = current.constructor?.name || 'Object.prototype';

    console.log(`${indent}└─ ${name}`);

    // 자신의 속성 출력
    Object.getOwnPropertyNames(current).forEach(prop => {
      if (prop !== 'constructor') {
        const value = typeof current[prop] === 'function' ? 'function' : current[prop];
        console.log(`${indent}   ├─ ${prop}: ${value}`);
      }
    });

    current = Object.getPrototypeOf(current);
    depth++;
  }

  console.log('=== End of Chain ===');
}

// 사용
function Animal() {}
Animal.prototype.eat = function() {};

function Dog() {}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.bark = function() {};

const myDog = new Dog();
myDog.name = '뽀삐';

printPrototypeChain(myDog);
// === Prototype Chain ===
// └─ Dog
//    ├─ name: 뽀삐
//   └─ Dog
//      ├─ bark: function
//     └─ Animal
//        ├─ eat: function
//       └─ Object.prototype
//          ├─ toString: function
//          ├─ hasOwnProperty: function
//          ...
// === End of Chain ===
```

### 팁 2: 속성이 어디서 왔는지 찾기

```javascript
function findPropertyOrigin(obj, property) {
  let current = obj;
  let depth = 0;

  while (current !== null) {
    if (current.hasOwnProperty(property)) {
      const name = current.constructor?.name || 'Object.prototype';
      console.log(`"${property}" found at level ${depth}: ${name}`);
      return current;
    }
    current = Object.getPrototypeOf(current);
    depth++;
  }

  console.log(`"${property}" not found in chain`);
  return null;
}

// 사용
findPropertyOrigin(myDog, 'name');  // "name" found at level 0: Dog
findPropertyOrigin(myDog, 'bark');  // "bark" found at level 1: Dog
findPropertyOrigin(myDog, 'eat');   // "eat" found at level 2: Animal
findPropertyOrigin(myDog, 'toString'); // "toString" found at level 3: Object.prototype
```

### 팁 3: Chrome DevTools에서 Chain 확인하기

```javascript
// 콘솔에서 실행
const myDog = new Dog();

// 방법 1: __proto__ 클릭해서 탐색
console.dir(myDog);

// 방법 2: getPrototypeOf로 수동 탐색
console.log(Object.getPrototypeOf(myDog));
console.log(Object.getPrototypeOf(Object.getPrototypeOf(myDog)));

// 방법 3: Chain 전체를 배열로
function getChain(obj) {
  const chain = [];
  let current = obj;
  while (current !== null) {
    chain.push(current);
    current = Object.getPrototypeOf(current);
  }
  return chain;
}

console.log(getChain(myDog));
```

### 팁 4: 메소드 오버라이드 확인하기

```javascript
function isOverridden(obj, method) {
  const ownHas = obj.hasOwnProperty(method);
  const protoHas = method in obj;

  if (!protoHas) {
    return 'Method does not exist';
  }

  if (ownHas) {
    return 'Overridden at instance level';
  }

  // Chain을 따라가며 어디서 처음 나타나는지 확인
  let current = Object.getPrototypeOf(obj);
  while (current !== null) {
    if (current.hasOwnProperty(method)) {
      const name = current.constructor?.name || 'Object.prototype';
      return `Defined at ${name}`;
    }
    current = Object.getPrototypeOf(current);
  }
}

// 사용
console.log(isOverridden(myDog, 'bark'));  // "Defined at Dog"
console.log(isOverridden(myDog, 'eat'));   // "Defined at Animal"
console.log(isOverridden(myDog, 'toString')); // "Defined at Object.prototype"
```

### 팁 5: Prototype 오염 감지하기

```javascript
// 보안 이슈: Prototype Pollution 확인
function detectPrototypePollution() {
  const suspicious = [];

  // Object.prototype 확인
  Object.getOwnPropertyNames(Object.prototype).forEach(prop => {
    if (prop !== 'constructor' && !['toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString'].includes(prop)) {
      suspicious.push(`Object.prototype.${prop}`);
    }
  });

  // Array.prototype 확인
  Object.getOwnPropertyNames(Array.prototype).forEach(prop => {
    if (!Array.prototype[prop].toString().includes('[native code]')) {
      suspicious.push(`Array.prototype.${prop}`);
    }
  });

  if (suspicious.length > 0) {
    console.warn('Suspicious properties found:', suspicious);
  } else {
    console.log('No prototype pollution detected');
  }
}

// 사용
detectPrototypePollution();

// 오염 시뮬레이션
Object.prototype.polluted = 'bad';
detectPrototypePollution();
// ⚠️ Suspicious properties found: ['Object.prototype.polluted']
```

## 결론: Chain을 마스터하기

### 핵심 요약

1. **Prototype Chain은 JavaScript 상속의 핵심입니다**
   - [prototype.md](./prototype.md)에서 배운 Prototype의 "동적 연결" 버전
   - 속성 조회는 Chain을 따라 올라가며 수행됩니다
   - 끝은 항상 `null`입니다

2. **Chain 탐색 알고리즘**
   ```
   obj.property 조회:
   → obj 자체 확인
   → obj.__proto__ 확인
   → obj.__proto__.__proto__ 확인
   → ...
   → null 도달 → undefined
   ```

3. **instanceof는 Chain 검사입니다**
   ```javascript
   obj instanceof Constructor
   // = Constructor.prototype이 Chain에 있는가?
   ```

4. **상속 = Chain 연결**
   ```javascript
   Child.prototype = Object.create(Parent.prototype);
   Child.prototype.constructor = Child;
   ```

5. **주의사항**
   - Chain을 너무 깊게 만들지 마세요 (2-3단계 권장)
   - Prototype에 참조 타입 넣지 마세요
   - `hasOwnProperty`와 `in`의 차이를 이해하세요
   - `constructor` 속성을 항상 복원하세요

### 언제 Chain을 의식해야 할까?

#### 의식해야 할 때:
- 🎯 상속 구조를 설계할 때
- 🎯 메소드가 어디서 왔는지 디버깅할 때
- 🎯 `instanceof` 결과가 이상할 때
- 🎯 성능 최적화를 할 때
- 🎯 `Object.create(null)` 사용을 고려할 때

#### 의식하지 않아도 될 때:
- 🎯 일반적인 객체 사용
- 🎯 `class` 문법으로 간단한 상속
- 🎯 평범한 메소드 호출

### 실전 가이드라인

```javascript
// ✅ 일반적인 경우: Class 사용
class Dog extends Animal {
  bark() {
    console.log('멍멍!');
  }
}

// ✅ Chain 이해가 필요한 경우: 직접 조작
Dog.prototype.newMethod = function() {
  // 동적으로 메소드 추가
};

// ✅ 디버깅 시: Chain 확인
console.log(myDog instanceof Dog);
console.log(Object.getPrototypeOf(myDog));

// ✅ 성능이 중요한 경우: 얕은 Chain 유지
// 너무 깊은 상속 대신 Composition 사용
```

### 마지막 조언

Prototype Chain은 JavaScript를 진정으로 이해하는 열쇠입니다. [prototype.md](./prototype.md)에서 "무엇"을 배웠다면, 이 문서에서는 "어떻게"를 배웠습니다.

**Chain을 마스터하면:**
- 🔍 에러 메시지를 보고 바로 원인을 파악할 수 있습니다
- 🔍 라이브러리 코드를 읽고 이해할 수 있습니다
- 🔍 상속 구조를 효율적으로 설계할 수 있습니다
- 🔍 성능 병목을 발견하고 최적화할 수 있습니다

하지만 기억하세요: **이해는 필수, 직접 조작은 필요할 때만**. 현대 JavaScript에서는 `class` 문법이 대부분의 경우를 커버합니다. Chain의 동작 원리를 이해하되, 코드는 간결하고 읽기 쉽게 유지하세요.

## 참고 자료

### 관련 문서
- **[prototype.md](./prototype.md)** - Prototype의 기본 개념 (필독!)
- [this.md](./this.md) - this 키워드와 Prototype의 관계
- [bind.md](./bind.md) - bind, call, apply와 Prototype
- [instance.md](./instance.md) - 인스턴스의 개념

### MDN 공식 문서
- [Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain) - 가장 정확한 설명
- [Object.getPrototypeOf()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getPrototypeOf)
- [Object.setPrototypeOf()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/setPrototypeOf) - 사용 주의!
- [instanceof operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof)
- [Object.create()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)

### 심화 학습
- [You Don't Know JS: this & Object Prototypes](https://github.com/getify/You-Dont-Know-JS/tree/1st-ed/this%20%26%20object%20prototypes) - Kyle Simpson의 명저
- [JavaScript: The Good Parts](http://shop.oreilly.com/product/9780596517748.do) - Douglas Crockford (Prototype 패턴 설명)
- [Eloquent JavaScript: Objects and Classes](https://eloquentjavascript.net/06_object.html)

### 디버깅 및 도구
- [Chrome DevTools: Inspect Object Prototypes](https://developer.chrome.com/docs/devtools/console/utilities/)
- [Understanding Prototypes in JavaScript](https://www.digitalocean.com/community/tutorials/understanding-prototypes-and-inheritance-in-javascript)

### 성능 및 최적화
- [JavaScript engine fundamentals: Shapes and Inline Caches](https://mathiasbynens.be/notes/shapes-ics) - V8 엔진의 Prototype 최적화
- [Optimizing prototypes](https://v8.dev/blog/fast-properties) - V8 팀의 공식 설명

### 보안
- [Prototype Pollution Attack](https://portswigger.net/daily-swig/prototype-pollution-the-dangerous-and-underrated-vulnerability-impacting-javascript-applications) - Prototype 오염 공격 이해
- [Preventing Prototype Pollution](https://stackoverflow.com/questions/8111446/how-to-prevent-prototype-pollution-in-javascript)

### 역사와 철학
- [JavaScript: The World's Most Misunderstood Programming Language](http://www.crockford.com/javascript/javascript.html) - Douglas Crockford
- [Why Prototypal Inheritance Matters](http://aaditmshah.github.io/why-prototypal-inheritance-matters/) - 철학적 관점

---

**다음 단계:** 이제 Prototype과 Prototype Chain을 마스터했으니, [this.md](./this.md)를 읽고 `this` 키워드가 Prototype과 어떻게 상호작용하는지 배워보세요!
