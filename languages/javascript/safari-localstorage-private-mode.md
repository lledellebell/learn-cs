---
title: Safari 사파리 브라우저 Private Browsing에서 localStorage 오류 처리하기
description: Safari 사생활 보호 모드에서 발생하는 localStorage 접근 오류를 안전하게 처리하는 방법
date: 2025-01-17
last_modified_at: 2025-10-17
categories: [JavaScript, Web Development]
tags: [JavaScript, Safari, Trouble Shooting]
layout: page
---

# Safari Private Browsing에서 localStorage 오류 처리하기

## 여러분도 이런 경험 있으신가요?

막 구현한 다크모드 기능을 iPhone으로 테스트하고 있었습니다. Chrome 개발자 도구에서는 완벽하게 작동했죠. 그런데 Safari로 열어보니... 토글을 클릭해도 아무 반응이 없습니다.

"이상하네, 분명 같은 코드인데?"

콘솔을 열어보니 빨간 에러 메시지가 가득했습니다:

> `QuotaExceededError: The quota has been exceeded.`

localStorage에 테마 설정을 저장하려는 순간 앱이 멈춰버린 것이었습니다. 더 놀라운 건, 일반 Safari에서는 문제없이 작동하는데 **Private Browsing 모드에서만** 이 에러가 발생한다는 것이었습니다.

**Safari의 Private Browsing 모드였습니다.**

Chrome이나 Firefox에서는 Private Mode에서도 localStorage가 잘 작동합니다. 하지만 Safari는 다릅니다. localStorage에 접근하려는 순간 예외를 던져버립니다. 그리고 우리의 애플리케이션은 그대로 멈춰버리죠.

사실 이 문제는 많은 개발자들이 간과하고 있습니다. 저도 몰랐고, 여러분도 혹시 모르고 계실 수 있습니다. 하지만 iOS 사용자들은 Safari를 기본 브라우저로 사용하고, 프라이버시를 중요하게 생각하는 사용자들은 Private Browsing을 자주 사용합니다.

이 글에서는 이 문제를 왜 이해해야 하는지, 어떻게 해결할 수 있는지 함께 살펴보겠습니다.

## 왜 이 문제를 이해해야 할까요?

### 1. Safari는 생각보다 많이 사용됩니다

iOS 사용자는 기본 브라우저로 Safari를 사용하며, macOS에서도 Safari의 점유율이 높습니다. 특히 한국에서는 모바일 Safari 사용자가 상당히 많습니다.

### 2. Private Browsing은 일반적인 사용 케이스입니다

많은 사용자들이 개인정보 보호를 위해 Private Browsing 모드를 자주 사용합니다. 이들이 당신의 웹사이트에 접근할 때 JavaScript 에러가 발생한다면, 사용자 경험이 크게 저하됩니다.

### 3. 단순한 try-catch만으로는 부족합니다

localStorage 접근 시 예외 처리는 기본이지만, 어디서 어떻게 처리해야 하는지 아는 것이 중요합니다.

## 문제 상황 - Safari Private Browsing의 동작

Safari의 Private Browsing 모드에서는 다음과 같은 특징이 있습니다:

```text
일반 모드:
localStorage.setItem('key', 'value') ✅ 정상 작동
localStorage.getItem('key') ✅ 정상 작동

Private Browsing 모드:
localStorage.setItem('key', 'value') ❌ QuotaExceededError 예외 발생
localStorage.getItem('key') ❌ null 반환 또는 예외 발생
```

### Safari가 이렇게 동작하는 이유: Private Browsing의 철학

이 부분에서 저는 처음에 의문이 들었습니다. "왜 Safari만 이렇게 하는 걸까? 다른 브라우저는 괜찮은데?"

사실 이는 **Private Browsing의 목적을 어떻게 해석하느냐**의 차이입니다.

#### 브라우저별 Private Mode 접근 방식

```text
┌─────────────────────────────────────────────────────────────┐
│ Private Browsing의 목적: 흔적을 남기지 않기                       │
└─────────────────────────────────────────────────────────────┘

Chrome/Firefox 접근:
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ 브라우징       │      │ localStorage │      │ 세션 종료시     │
│ 시작          │ ───> │ 임시 저장      │ ───> │ 모두 삭제       │
└──────────────┘      └──────────────┘      └──────────────┘
                      "일단 사용하고 나중에 지운다"

Safari 접근:
┌──────────────┐      ┌──────────────┐
│ 브라우징       │      │ localStorage │
│ 시작           │ ───X │ 차단         │
└──────────────┘      └──────────────┘
                      "애초에 사용하지 못하게 한다"
```

Safari의 관점은 이렇습니다:

> "Private Browsing이라면, 그 어떤 데이터도 디스크에 쓰여서는 안 된다. 설사 나중에 지울 거라 하더라도."

이는 더 엄격한 프라이버시 보호입니다. 예를 들어:
- 세션 중 시스템이 갑자기 종료되면?
- 디스크에 임시로 쓰여진 데이터가 복구 가능하다면?

Safari는 이런 가능성조차 차단하기 위해 localStorage의 **quota(할당량)를 0으로 설정**합니다. 실제로 localStorage 객체는 존재하지만, 저장 공간이 0바이트이기 때문에 어떤 데이터도 저장할 수 없습니다.

#### 브라우저별 동작 비교

```text
┌────────────────┬─────────────────┬──────────────────────┐
│ 브라우저         │ Private Mode    │ localStorage 동작    │
├────────────────┼─────────────────┼──────────────────────┤
│ Chrome/Edge    │ Incognito       │ ✅ 사용 가능            │
│                │                 │    (세션 종료시 삭제)    │
├────────────────┼─────────────────┼──────────────────────┤
│ Firefox        │ Private Window  │ ✅ 사용 가능           │
│                │                 │    (세션 종료시 삭제)   │
├────────────────┼─────────────────┼──────────────────────┤
│ Safari         │ Private Browsing│ ❌ QuotaExceeded    │
│                │                 │    (quota = 0)       │
└────────────────┴─────────────────┴──────────────────────┘
```

이제 이해가 되시나요? Safari가 이상한 것이 아니라, **더 엄격한 프라이버시 정책**을 선택한 것입니다. 그리고 우리 개발자들은 이 차이를 고려해야 합니다.

## 해결 방법

### 1. 기본 패턴: try-catch로 감싸기

가장 기본적인 해결 방법은 localStorage 접근 코드를 try-catch로 감싸는 것입니다.

```javascript
// ❌ 안전하지 않은 코드 - Safari Private Browsing에서 앱이 멈춥니다
function saveTheme(theme) {
  // Safari Private Browsing에서 QuotaExceededError 발생!
  // 예외가 처리되지 않아 JavaScript 실행이 중단됩니다
  localStorage.setItem('theme', theme);
}

function loadTheme() {
  // getItem도 예외를 던질 수 있습니다
  return localStorage.getItem('theme') || 'light';
}

// 사용자가 다크 모드로 변경하려고 클릭하면...
saveTheme('dark'); // 💥 여기서 앱이 멈춥니다!
```

**무엇이 문제일까요?**

이 코드는 Chrome과 Firefox에서는 완벽하게 작동합니다. 하지만 Safari Private Browsing에서는 `localStorage.setItem()`이 호출되는 순간 예외가 발생합니다. 예외가 처리되지 않으면:

1. JavaScript 실행이 중단됩니다
2. 이후 코드가 실행되지 않습니다
3. 사용자는 "사이트가 작동하지 않는다"고 느낍니다

이제 안전한 버전을 봅시다:

```javascript
// ✅ 안전한 코드 - 모든 브라우저에서 작동합니다
function saveTheme(theme) {
  try {
    // localStorage 저장 시도
    localStorage.setItem('theme', theme);
  } catch (e) {
    // Safari Private Browsing이나 다른 이유로 실패해도
    // 앱은 계속 작동합니다
    console.warn('localStorage 저장 실패:', e);

    // 옵션 1: 아무것도 하지 않기 (테마는 세션 동안만 유지)
    // 옵션 2: 메모리에 저장하기 (다음 섹션에서 설명)
    // 옵션 3: 쿠키나 다른 방법 사용하기
  }
}

function loadTheme() {
  try {
    // localStorage에서 테마 읽기 시도
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  } catch (e) {
    // 접근 실패시에도 앱은 계속 작동
    console.warn('localStorage 접근 불가:', e);
    // 기본값을 반환하여 앱이 정상 작동하도록 함
    return 'light';
  }
}

// 이제 Safari Private Browsing에서도 안전합니다
saveTheme('dark'); // ✅ 예외가 발생해도 앱은 계속 작동합니다
const currentTheme = loadTheme(); // ✅ 기본값 'light'를 반환합니다
```

**핵심 차이점:**

| 측면 | 안전하지 않은 코드 | 안전한 코드 |
|------|-------------------|-------------|
| Safari Private Browsing | 💥 앱 중단 | ✅ 계속 작동 |
| 사용자 경험 | 기능이 멈춤 | 정상 작동 (저장만 안됨) |
| 에러 처리 | 없음 | 적절한 fallback |

### 2. 실전 패턴: 초기화 단계에서 체크하기

애플리케이션 초기화 시점에 localStorage 사용 가능 여부를 체크하고, 이후에는 플래그를 확인하는 방식이 더 효율적입니다.

```javascript
// localStorage 사용 가능 여부를 확인하는 유틸리티
let isLocalStorageAvailable = false;

function checkLocalStorageAvailability() {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    isLocalStorageAvailable = true;
    return true;
  } catch (e) {
    console.warn('localStorage를 사용할 수 없습니다:', e);
    isLocalStorageAvailable = false;
    return false;
  }
}

// 앱 초기화 시 호출
checkLocalStorageAvailability();

// 이후 사용 시
function saveTheme(theme) {
  if (!isLocalStorageAvailable) {
    console.warn('localStorage를 사용할 수 없어 저장하지 않습니다.');
    return;
  }

  try {
    localStorage.setItem('theme', theme);
  } catch (e) {
    console.warn('localStorage 저장 실패:', e);
  }
}
```

### 3. 고급 패턴: Storage Wrapper 만들기

재사용 가능한 Storage Wrapper를 만들면 코드 전체에서 안전하게 localStorage를 사용할 수 있습니다.

```javascript
// 안전한 Storage Wrapper
const SafeStorage = {
  isAvailable: false,

  // 초기화
  init() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isAvailable = true;
    } catch (e) {
      this.isAvailable = false;
      console.warn('localStorage를 사용할 수 없습니다:', e);
    }
    return this.isAvailable;
  },

  // 저장
  setItem(key, value) {
    if (!this.isAvailable) return false;

    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('localStorage 저장 실패:', e);
      return false;
    }
  },

  // 불러오기
  getItem(key, defaultValue = null) {
    if (!this.isAvailable) return defaultValue;

    try {
      const value = localStorage.getItem(key);
      return value !== null ? value : defaultValue;
    } catch (e) {
      console.warn('localStorage 접근 불가:', e);
      return defaultValue;
    }
  },

  // 삭제
  removeItem(key) {
    if (!this.isAvailable) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('localStorage 삭제 실패:', e);
      return false;
    }
  }
};

// 앱 초기화
SafeStorage.init();

// 사용 예시
SafeStorage.setItem('theme', 'dark');
const theme = SafeStorage.getItem('theme', 'light');
```

### 4. 메모리 Fallback을 가진 고급 Wrapper

localStorage를 사용할 수 없을 때 메모리에 저장하는 fallback을 추가할 수 있습니다.

```javascript
// 메모리 fallback이 있는 Storage Wrapper
const SmartStorage = {
  isLocalStorageAvailable: false,
  memoryStorage: {}, // fallback 저장소

  init() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isLocalStorageAvailable = true;
      console.log('✅ localStorage 사용 가능');
    } catch (e) {
      this.isLocalStorageAvailable = false;
      console.warn('⚠️ localStorage를 사용할 수 없습니다. 메모리 저장소를 사용합니다.');
    }
    return this.isLocalStorageAvailable;
  },

  setItem(key, value) {
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.warn('localStorage 저장 실패, 메모리로 전환:', e);
        this.isLocalStorageAvailable = false;
      }
    }

    // fallback to memory
    this.memoryStorage[key] = value;
    return true;
  },

  getItem(key, defaultValue = null) {
    if (this.isLocalStorageAvailable) {
      try {
        const value = localStorage.getItem(key);
        return value !== null ? value : defaultValue;
      } catch (e) {
        console.warn('localStorage 접근 실패, 메모리로 전환:', e);
        this.isLocalStorageAvailable = false;
      }
    }

    // fallback to memory
    return this.memoryStorage[key] ?? defaultValue;
  },

  removeItem(key) {
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('localStorage 삭제 실패:', e);
      }
    }

    // fallback to memory
    delete this.memoryStorage[key];
    return true;
  },

  clear() {
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.clear();
      } catch (e) {
        console.warn('localStorage 초기화 실패:', e);
      }
    }

    // fallback to memory
    this.memoryStorage = {};
    return true;
  }
};

// 앱 초기화
SmartStorage.init();

// 사용 예시
SmartStorage.setItem('user', JSON.stringify({ name: 'John' }));
const user = JSON.parse(SmartStorage.getItem('user', '{}'));
```

## 실전 적용 예시

앞서 수정한 main.js 코드를 다시 살펴보겠습니다.

### Before: 안전하지 않은 코드

```javascript
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'light'; // ❌ 예외 발생 가능
  html.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    localStorage.setItem('theme', newTheme); // ❌ 예외 발생 가능
  });
};
```

### After: 안전한 코드

```javascript
const initTheme = () => {
  // 저장된 테마 불러오기
  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem('theme') || 'light'; // ✅ 안전
  } catch (e) {
    console.warn('localStorage 접근 불가:', e);
  }
  html.setAttribute('data-theme', savedTheme);

  themeToggle.addEventListener('click', () => {
    try {
      localStorage.setItem('theme', newTheme); // ✅ 안전
    } catch (e) {
      console.warn('localStorage 저장 실패:', e);
    }
  });
};
```

## 흔한 실수와 함정

### 함정 1: JSON.parse/stringify 사용 시 이중 try-catch

객체를 저장할 때는 JSON.stringify와 localStorage 접근 모두에서 예외가 발생할 수 있습니다.

```javascript
// ❌ 불완전한 예외 처리
function saveUser(user) {
  try {
    localStorage.setItem('user', JSON.stringify(user)); // stringify도 실패할 수 있음
  } catch (e) {
    console.warn('저장 실패:', e);
  }
}

// ✅ 완전한 예외 처리
function saveUser(user) {
  try {
    const userJson = JSON.stringify(user);
    try {
      localStorage.setItem('user', userJson);
    } catch (e) {
      console.warn('localStorage 저장 실패:', e);
    }
  } catch (e) {
    console.warn('JSON 변환 실패:', e);
  }
}
```

### 함정 2: 초기화 없이 바로 사용

앱 초기화 시점에 localStorage 가능 여부를 체크하지 않으면, 매번 try-catch를 작성해야 합니다.

```javascript
// ❌ 비효율적 - 매번 try-catch
function doSomething() {
  try {
    const value = localStorage.getItem('key');
    // ...
  } catch (e) {
    // ...
  }
}

// ✅ 효율적 - 초기화 시 한 번만 체크
let canUseLocalStorage = false;

// 앱 초기화
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  canUseLocalStorage = true;
} catch (e) {
  canUseLocalStorage = false;
}

// 이후 사용 시
function doSomething() {
  if (!canUseLocalStorage) return;

  const value = localStorage.getItem('key');
  // ...
}
```

### 함정 3: 모든 브라우저가 같다고 가정

Chrome에서만 테스트하고 배포하면 Safari 사용자가 문제를 겪게 됩니다.

```javascript
// ❌ Chrome에서만 작동
localStorage.setItem('theme', 'dark');

// ✅ 크로스 브라우저 호환
try {
  localStorage.setItem('theme', 'dark');
} catch (e) {
  // Safari Private Browsing 대응
}
```

## 테스트 방법

### Safari Private Browsing 모드 테스트

1. Safari 열기
2. `Cmd + Shift + N` (Private Browsing 모드)
3. 웹사이트 접근
4. 개발자 도구 열기 (`Cmd + Option + I`)
5. Console에서 localStorage 접근 시도

```javascript
// Console에서 테스트
localStorage.setItem('test', 'value');
// QuotaExceededError 발생 확인
```

### 자동화된 테스트

```javascript
describe('localStorage fallback', () => {
  it('should handle Safari Private Browsing', () => {
    // localStorage를 사용할 수 없도록 Mock
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    setItemSpy.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    // 함수 실행이 예외를 던지지 않아야 함
    expect(() => {
      saveTheme('dark');
    }).not.toThrow();

    setItemSpy.mockRestore();
  });
});
```

## 디버깅 팁

### Console에서 localStorage 상태 확인

```javascript
// localStorage 사용 가능 여부 체크
function checkLocalStorage() {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    console.log('✅ localStorage 사용 가능');
    return true;
  } catch (e) {
    console.error('❌ localStorage 사용 불가:', e.name, e.message);
    return false;
  }
}

checkLocalStorage();
```

### 브라우저별 에러 메시지

- **Safari Private Browsing**: `QuotaExceededError: DOM Exception 22`
- **Firefox**: 일반적으로 정상 작동 (세션 종료 시 삭제)
- **Chrome**: 일반적으로 정상 작동 (세션 종료 시 삭제)

## 실전에서의 선택

프로젝트 규모와 요구사항에 따라 적절한 방법을 선택하세요:

### 소규모 프로젝트
- **방법 1**: 각 localStorage 접근마다 try-catch
- **장점**: 간단하고 빠르게 적용
- **단점**: 코드 중복, 유지보수 어려움

### 중규모 프로젝트
- **방법 2**: 초기화 시 체크 + 플래그 사용
- **장점**: 효율적이고 관리하기 쉬움
- **단점**: 초기화 로직이 필요

### 대규모 프로젝트
- **방법 3**: Storage Wrapper 또는 라이브러리 사용
- **장점**: 재사용 가능, 테스트 용이, 확장성 좋음
- **단점**: 초기 설정 비용

## 권장 라이브러리

직접 구현하는 대신 검증된 라이브러리를 사용할 수도 있습니다:

### 1. store.js
```javascript
import store from 'store';

// 자동으로 fallback 처리
store.set('theme', 'dark');
const theme = store.get('theme', 'light');
```

### 2. localForage
```javascript
import localForage from 'localforage';

// Promise 기반 API
await localForage.setItem('theme', 'dark');
const theme = await localForage.getItem('theme');
```

## 정리

Safari Private Browsing에서 localStorage 오류를 처리하는 것은 **필수**입니다. 다음 체크리스트를 확인하세요:

- [ ] localStorage 접근 시 try-catch로 감싸기
- [ ] 앱 초기화 시 localStorage 가능 여부 체크
- [ ] 적절한 fallback 전략 수립 (메모리 저장소, 기본값 등)
- [ ] Safari Private Browsing 모드에서 테스트
- [ ] 에러 발생 시 사용자 경험 저하 없도록 처리
- [ ] Console에 적절한 경고 메시지 출력

## 참고 자료

- [MDN - Window.localStorage](https://developer.mozilla.org/ko/docs/Web/API/Window/localStorage)
- [Safari Release Notes - Private Browsing](https://developer.apple.com/documentation/safari-release-notes)
- [QuotaExceededError - MDN](https://developer.mozilla.org/en-US/docs/Web/API/DOMException#quotaexceedederror)
- [store.js - Cross-browser storage library](https://github.com/marcuswestin/store.js)
- [localForage - Offline storage, improved](https://github.com/localForage/localForage)

## 추가 학습

- **Web Storage API 전반**: sessionStorage, IndexedDB 등 다른 저장 방법
- **Progressive Enhancement**: 저장소를 사용할 수 없어도 기본 기능은 작동하도록
- **Privacy-first Web**: 사용자 프라이버시를 존중하는 웹 개발
