---
title: `forEach` vs `reduce`
date: 2025-10-02
categories: [Programming, JavaScript]
tags: [forEach, reduce, Array Methods, Functional Programming, Side Effects]
layout: page
---
# `forEach` vs `reduce`

함수형 프로그래밍 관점에서의 배열 메서드 선택

## `forEach`를 지양해야 하는 이유

### 1. 부수효과(Side Effect) 발생

`forEach`는 본질적으로 부수효과를 발생시키는 메서드입니다.

```js
// ❌ forEach - 부수효과 발생
let total = 0;
numbers.forEach(num => {
  total += num; // 외부 변수를 수정 (부수효과)
});

// ✅ reduce - 순수함수
const total = numbers.reduce((sum, num) => sum + num, 0);
```

### 2. 함수형 프로그래밍 원칙 위배

함수형 프로그래밍에서는 **불변성(Immutability)**과 **순수함수(Pure Function)**를 지향합니다.

```js
// ❌ forEach - 기존 배열을 수정
const users = [{name: 'John', active: false}];
users.forEach(user => {
  user.active = true; // 원본 데이터 수정
});

// ✅ map - 새로운 배열 반환
const activeUsers = users.map(user => ({
  ...user,
  active: true
}));
```

### 3. 의도가 불분명

`forEach`는 "무엇을 하는지" 명확하지 않습니다.

```js
// ❌ forEach - 의도 불분명
const results = [];
items.forEach(item => {
  if (item.price > 100) {
    results.push(item.name);
  }
});

// ✅ filter + map - 의도 명확
const results = items
  .filter(item => item.price > 100)
  .map(item => item.name);
```

## 상황별 적절한 배열 메서드 선택

### 1. 데이터 변환 - `map` 사용

```js
// 가격에 세금 추가
const productsWithTax = products.map(product => ({
  ...product,
  priceWithTax: product.price * 1.1
}));
```

### 2. 데이터 필터링 - `filter` 사용

```js
// 활성 사용자만 선택
const activeUsers = users.filter(user => user.isActive);
```

### 3. 누적 계산 - `reduce` 사용

```js
// 총합 계산
const totalPrice = orders.reduce((sum, order) => sum + order.amount, 0);

// 객체 생성
const userMap = users.reduce((map, user) => {
  map[user.id] = user;
  return map;
}, {});
```

### 4. 조건 확인 - `some`/`every` 사용

```js
// 하나라도 조건을 만족하는지
const hasExpensiveItem = products.some(product => product.price > 1000);

// 모든 항목이 조건을 만족하는지
const allInStock = products.every(product => product.stock > 0);
```

## 실무 적용 사례

### 전자상거래 할인 계산 개선

```js
// ❌ forEach 사용 (부수효과)
function calculateDiscountedPrice(basePrice, discounts) {
  let finalPrice = basePrice;
  discounts.forEach(discount => {
    if (discount.type === 'percentage') {
      finalPrice *= (1 - discount.value / 100);
    } else {
      finalPrice -= discount.value;
    }
  });
  return finalPrice;
}

// ✅ reduce 사용 (함수형)
function calculateDiscountedPrice(basePrice, discounts) {
  return discounts.reduce((price, discount) => {
    if (discount.type === 'percentage') {
      return price * (1 - discount.value / 100);
    } else {
      return price - discount.value;
    }
  }, basePrice);
}
```

### 데이터 처리 파이프라인

```js
// ❌ forEach로 여러 단계 처리
const processedData = [];
rawData.forEach(item => {
  if (item.status === 'active') {
    const processed = {
      id: item.id,
      name: item.name.toUpperCase(),
      score: item.score * 1.1
    };
    processedData.push(processed);
  }
});

// ✅ 메서드 체이닝으로 명확한 파이프라인
const processedData = rawData
  .filter(item => item.status === 'active')
  .map(item => ({
    id: item.id,
    name: item.name.toUpperCase(),
    score: item.score * 1.1
  }));
```

## 성능 비교

### 벤치마크 테스트

```js
const largeArray = Array.from({length: 1000000}, (_, i) => i);

// forEach 성능 테스트
console.time('forEach');
let sum1 = 0;
largeArray.forEach(num => sum1 += num);
console.timeEnd('forEach');

// reduce 성능 테스트
console.time('reduce');
const sum2 = largeArray.reduce((sum, num) => sum + num, 0);
console.timeEnd('reduce');

// for 루프 성능 테스트 (가장 빠름)
console.time('for');
let sum3 = 0;
for (let i = 0; i < largeArray.length; i++) {
  sum3 += largeArray[i];
}
console.timeEnd('for');
```

**일반적인 성능 순서**: `for` > `reduce` > `forEach`

## `forEach`를 사용해도 되는 경우

### 1. 순수한 부수효과가 목적인 경우

```js
// 로깅, DOM 조작 등
users.forEach(user => {
  console.log(`Processing user: ${user.name}`);
});

// 이벤트 리스너 등록
buttons.forEach(button => {
  button.addEventListener('click', handleClick);
});
```

### 2. 외부 API 호출

```js
// 각 사용자에게 이메일 발송
users.forEach(async user => {
  await sendEmail(user.email, message);
});
```

## 함수형 프로그래밍 베스트 프랙티스

### 1. 메서드 체이닝 활용

```js
const result = data
  .filter(item => item.isValid)
  .map(item => item.value)
  .reduce((sum, value) => sum + value, 0);
```

### 2. 불변성 유지

```js
// ❌ 원본 수정
const updateUser = (users, id, updates) => {
  const user = users.find(u => u.id === id);
  Object.assign(user, updates);
  return users;
};

// ✅ 새로운 객체 반환
const updateUser = (users, id, updates) => {
  return users.map(user => 
    user.id === id ? { ...user, ...updates } : user
  );
};
```

### 3. 순수함수 작성

```js
// ❌ 부수효과 있는 함수
let counter = 0;
const impureFunction = (arr) => {
  counter++; // 외부 상태 변경
  return arr.length;
};

// ✅ 순수함수
const pureFunction = (arr) => {
  return arr.length;
};
```

## 기타

### 배열 메서드 선택 가이드

- [ ] **변환이 목적**인가? → `map` 사용
- [ ] **필터링이 목적**인가? → `filter` 사용  
- [ ] **누적 계산이 목적**인가? → `reduce` 사용
- [ ] **조건 확인이 목적**인가? → `some`/`every` 사용
- [ ] **순수한 부수효과가 목적**인가? → `forEach` 사용 가능

### 함수형 프로그래밍 체크리스트

- [ ] 함수가 순수함수인가?
- [ ] 불변성을 유지하고 있는가?
- [ ] 부수효과를 최소화했는가?
- [ ] 의도가 명확하게 드러나는가?

## 참고 자료

- **[MDN - Array methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)**
- **[Functional Programming in JavaScript](https://mostly-adequate.gitbooks.io/mostly-adequate-guide/)**
- **[You Don't Know JS - ES6 & Beyond](https://github.com/getify/You-Dont-Know-JS)**

- **[ESLint - functional rules](https://github.com/jonaskello/eslint-plugin-functional)**
- **[Ramda](https://ramdajs.com/)**
- **[Lodash/FP](https://github.com/lodash/lodash/wiki/FP-Guide)**

