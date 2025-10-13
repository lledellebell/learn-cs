---
title: 나만의 npm 라이브러리 만들고 세상과 공유하기
date: 2025-10-13
layout: page
---

# 나만의 npm 라이브러리 만들고 세상과 공유하기

프로젝트를 진행하다 보면 이런 경험을 해본 적 있나요? "아, 이 유틸리티 함수 저번 프로젝트에서도 썼는데... 복사해야 하나?" 저도 처음에는 코드를 복사-붙여넣기하면서 "나중에 정리해야지"라고 생각했습니다. 하지만 프로젝트가 늘어날수록 같은 코드가 여러 곳에 퍼져있고, 버그를 수정하려면 모든 프로젝트를 찾아다녀야 했습니다.

상상해보세요. 여러분이 만든 편리한 날짜 포맷팅 함수가 3개의 프로젝트에 복사되어 있습니다. 그런데 버그를 발견했어요. 이제 3개의 프로젝트를 모두 찾아서 수정해야 합니다. 한 곳을 빼먹으면? 그 프로젝트에서는 계속 버그가 발생하겠죠.

이 문서에서는 이런 문제를 근본적으로 해결하는 방법, 즉 **나만의 npm 라이브러리를 만들고 배포하는 전 과정**을 실전 예제와 함께 자세히 다룹니다.

## 왜 npm 라이브러리를 만들어야 할까요?

### 1. 코드 재사용성과 유지보수

**문제 상황:**
```typescript
// project-a/utils/date.ts
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR');
}

// project-b/helpers/date.ts (복사됨)
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR');
}

// project-c/lib/date.ts (또 복사됨)
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR');
}
```

버그를 발견했습니다: Safari에서 날짜 형식이 이상합니다. 이제 3개 프로젝트를 모두 수정해야 합니다.

**npm 라이브러리 사용:**
```typescript
// @myname/date-utils 패키지로 만들면
// 모든 프로젝트에서:
import { formatDate } from '@myname/date-utils';

// 버그 수정은 한 번만, 배포 후 업데이트는 npm update
```

### 2. 오픈소스 기여와 포트폴리오

여러분이 만든 유용한 React Hook이나 유틸리티 함수는 다른 개발자들에게도 도움이 될 수 있습니다. npm에 배포하면:
- 다른 개발자들이 사용하고 피드백을 줍니다
- GitHub Stars가 쌓이면서 포트폴리오가 됩니다
- 기술 블로그나 이력서에 "npm 패키지 메인테이너" 경험을 쓸 수 있습니다

### 3. 팀 내 코드 공유

회사나 팀에서 여러 프로젝트를 관리한다면, 공통 코드를 private npm 패키지로 만들면:
- 일관된 코딩 스타일과 로직 공유
- 디자인 시스템 컴포넌트 배포
- API 클라이언트 라이브러리 공유

## 기본 개념

### npm 패키지란?

npm(Node Package Manager) 패키지는 재사용 가능한 JavaScript/TypeScript 코드 묶음입니다.

```
패키지의 구조
┌─────────────────────────────────┐
│  my-awesome-package/            │
│  ├── package.json     (메타데이터)│
│  ├── src/            (소스 코드) │
│  ├── dist/           (빌드 결과) │
│  ├── README.md       (문서)     │
│  └── LICENSE         (라이선스)  │
└─────────────────────────────────┘
         ↓ npm publish
┌─────────────────────────────────┐
│     npm Registry                │
│  (npmjs.com)                    │
└─────────────────────────────────┘
         ↓ npm install
┌─────────────────────────────────┐
│  사용자의 프로젝트               │
│  node_modules/                  │
│  └── my-awesome-package/        │
└─────────────────────────────────┘
```

### ESM vs CommonJS

JavaScript 모듈 시스템에는 두 가지 주요 방식이 있습니다:

**CommonJS (CJS) - 전통적인 Node.js 방식:**
```javascript
// 내보내기
module.exports = { add };
// 또는
exports.add = add;

// 가져오기
const { add } = require('./math');
```

**ES Modules (ESM) - 현대적인 표준:**
```javascript
// 내보내기
export { add };
export default calculator;

// 가져오기
import { add } from './math';
import calculator from './math';
```

**왜 둘 다 지원해야 할까요?**
- 오래된 Node.js 프로젝트는 CommonJS를 사용합니다
- 최신 프론트엔드 프로젝트는 ESM을 선호합니다
- Tree-shaking(사용하지 않는 코드 제거)은 ESM에서만 가능합니다

```
모듈 시스템 호환성
┌──────────────────────────────────────┐
│  라이브러리 (CJS + ESM 모두 제공)    │
└──────────────────────────────────────┘
         ↓              ↓
    ┌─────────┐    ┌─────────┐
    │ CJS 앱   │    │ ESM 앱   │
    │ (Node.js)│    │ (Vite)   │
    └─────────┘    └─────────┘
```

### package.json의 핵심 필드

```json
{
  "name": "@myname/awesome-lib",
  "version": "1.0.0",
  "description": "멋진 유틸리티 라이브러리",
  "main": "./dist/index.cjs",      // CommonJS 진입점
  "module": "./dist/index.mjs",    // ESM 진입점
  "types": "./dist/index.d.ts",    // TypeScript 타입 정의
  "exports": {
    ".": {
      "import": "./dist/index.mjs",  // ESM 사용 시
      "require": "./dist/index.cjs", // CJS 사용 시
      "types": "./dist/index.d.ts"   // 타입 정의
    }
  },
  "files": [                       // 배포할 파일
    "dist",
    "README.md"
  ],
  "sideEffects": false,            // Tree-shaking 최적화
  "keywords": ["utility", "helper"],
  "author": "Your Name",
  "license": "MIT"
}
```

## 프로젝트 설정

### 1단계: 프로젝트 초기화

```bash
# 디렉토리 생성
mkdir my-awesome-lib
cd my-awesome-lib

# Git 초기화
git init

# npm 초기화
npm init -y

# TypeScript 설정
npm install -D typescript
npx tsc --init
```

### 2단계: TypeScript 설정

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",              // 최신 JavaScript 기능 사용
    "module": "ESNext",              // ESM 모듈 시스템
    "declaration": true,             // .d.ts 파일 생성
    "declarationMap": true,          // 타입 정의 소스맵
    "outDir": "./dist",              // 빌드 출력 디렉토리
    "rootDir": "./src",              // 소스 디렉토리
    "strict": true,                  // 엄격한 타입 체크
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 3단계: 빌드 도구 선택

라이브러리를 빌드하는 여러 도구가 있습니다:

#### 옵션 A: tsup (추천 - 가장 간단)

```bash
npm install -D tsup
```

```json
// package.json
{
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts"
  }
}
```

```typescript
// tsup.config.ts (선택사항)
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
});
```

#### 옵션 B: Rollup (더 많은 제어)

```bash
npm install -D rollup @rollup/plugin-typescript @rollup/plugin-node-resolve
```

```javascript
// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.cjs',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.mjs',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    nodeResolve(),
    typescript({ tsconfig: './tsconfig.json' }),
  ],
  external: ['react', 'react-dom'], // peerDependencies
};
```

## 실전 예제

### 예제 1: 간단한 유틸리티 라이브러리

프로젝트에서 자주 사용하는 날짜, 문자열 유틸리티를 만들어봅시다.

```typescript
// src/date.ts
/**
 * Date를 YYYY-MM-DD 형식으로 포맷팅합니다.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 두 날짜 사이의 일수를 계산합니다.
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.round(diffTime / oneDay);
}

/**
 * 상대적인 시간을 표시합니다 (예: "3분 전")
 */
export function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const intervals = {
    년: 31536000,
    개월: 2592000,
    주: 604800,
    일: 86400,
    시간: 3600,
    분: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval}${unit} 전`;
    }
  }

  return '방금 전';
}
```

```typescript
// src/string.ts
/**
 * 문자열을 kebab-case로 변환합니다.
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * 문자열을 camelCase로 변환합니다.
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

/**
 * 문자열을 자르고 말줄임표를 추가합니다.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}
```

```typescript
// src/index.ts
export * from './date';
export * from './string';

// 네임스페이스로도 export
import * as DateUtils from './date';
import * as StringUtils from './string';

export { DateUtils, StringUtils };
```

**사용 예시:**
```typescript
// 다른 프로젝트에서
import { formatDate, timeAgo, toKebabCase } from '@myname/utils';

const today = new Date();
console.log(formatDate(today)); // "2025-10-13"
console.log(timeAgo(new Date(Date.now() - 3600000))); // "1시간 전"
console.log(toKebabCase("Hello World")); // "hello-world"

// 또는 네임스페이스로
import { DateUtils } from '@myname/utils';
console.log(DateUtils.formatDate(today));
```

### 예제 2: React Hook 라이브러리

자주 사용하는 Custom Hook들을 라이브러리로 만들어봅시다.

```typescript
// src/useLocalStorage.ts
import { useState, useEffect } from 'react';

/**
 * localStorage와 동기화되는 상태를 제공합니다.
 *
 * @example
 * const [name, setName] = useLocalStorage('username', 'Guest');
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // 초기값 가져오기
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 값 저장
  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
```

```typescript
// src/useDebounce.ts
import { useState, useEffect } from 'react';

/**
 * 값을 디바운스합니다.
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 * // debouncedSearch는 500ms 후에 업데이트됨
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

```typescript
// src/useClickOutside.ts
import { useEffect, RefObject } from 'react';

/**
 * 요소 외부 클릭을 감지합니다.
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * useClickOutside(ref, () => setIsOpen(false));
 */
export function useClickOutside(
  ref: RefObject<HTMLElement>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // ref 내부를 클릭하면 무시
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
```

```typescript
// src/index.ts
export { useLocalStorage } from './useLocalStorage';
export { useDebounce } from './useDebounce';
export { useClickOutside } from './useClickOutside';
```

**package.json 설정 (React Hook 라이브러리):**
```json
{
  "name": "@myname/react-hooks",
  "version": "1.0.0",
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "react": "^18.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 예제 3: CLI 도구

명령줄 도구를 만들어봅시다.

```bash
npm install commander chalk ora
npm install -D @types/node
```

```typescript
// src/cli.ts
#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();

program
  .name('mytools')
  .description('편리한 CLI 도구 모음')
  .version('1.0.0');

// count 명령어
program
  .command('count <file>')
  .description('파일의 줄 수를 세어줍니다')
  .action(async (file: string) => {
    const spinner = ora('파일을 읽는 중...').start();

    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n').length;

      spinner.succeed(chalk.green(`✓ ${file}: ${lines} 줄`));
    } catch (error) {
      spinner.fail(chalk.red(`✗ 오류: ${error.message}`));
    }
  });

// init 명령어
program
  .command('init <name>')
  .description('새 프로젝트를 초기화합니다')
  .option('-t, --template <type>', '템플릿 타입', 'basic')
  .action(async (name: string, options: { template: string }) => {
    console.log(chalk.blue(`📦 ${name} 프로젝트를 생성합니다...`));
    console.log(chalk.gray(`템플릿: ${options.template}`));

    const spinner = ora('파일을 생성하는 중...').start();

    // 실제 파일 생성 로직
    await new Promise(resolve => setTimeout(resolve, 1000));

    spinner.succeed(chalk.green('✓ 프로젝트 생성 완료!'));
    console.log(chalk.yellow('\n다음 단계:'));
    console.log(chalk.gray(`  cd ${name}`));
    console.log(chalk.gray(`  npm install`));
    console.log(chalk.gray(`  npm start`));
  });

program.parse();
```

```json
// package.json
{
  "name": "@myname/cli-tools",
  "version": "1.0.0",
  "bin": {
    "mytools": "./dist/cli.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/cli.ts --format cjs --minify"
  }
}
```

**사용 예시:**
```bash
npm install -g @myname/cli-tools

mytools count file.txt
mytools init my-project --template react
```

### 예제 4: TypeScript 유틸리티 타입 라이브러리

```typescript
// src/types.ts
/**
 * 객체의 특정 필드를 필수로 만듭니다.
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * 객체의 특정 필드를 선택적으로 만듭니다.
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 깊은 Partial (중첩된 객체도 모두 선택적으로)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 깊은 Required (중첩된 객체도 모두 필수로)
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * 함수의 첫 번째 매개변수 타입을 추출
 */
export type FirstParameter<T extends (...args: any[]) => any> =
  T extends (first: infer P, ...args: any[]) => any ? P : never;

/**
 * Promise가 resolve하는 타입을 추출
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * 배열 또는 단일 값
 */
export type ArrayOrSingle<T> = T | T[];
```

**사용 예시:**
```typescript
import type { RequiredFields, DeepPartial } from '@myname/type-utils';

interface User {
  id?: string;
  name: string;
  email?: string;
  profile?: {
    age?: number;
    bio?: string;
  };
}

// id와 email을 필수로 만들기
type RegisteredUser = RequiredFields<User, 'id' | 'email'>;

// 모든 필드를 선택적으로 (중첩 포함)
type UserUpdate = DeepPartial<User>;
```

## 좋은 예 vs 나쁜 예

### 1. 모듈 Export 방식

#### ❌ 나쁜 예: 기본 export만 사용
```typescript
// 사용자가 이름을 직접 지어야 하고, 자동완성이 어려움
export default function formatDate(date: Date) { ... }
export default { formatDate, parseDate }; // 여러 함수를 객체로
```

```typescript
// 사용할 때
import myDate from '@myname/utils'; // 무슨 함수가 있는지 모름
myDate.formatDate(...); // IDE 자동완성 지원 제한적
```

#### ✅ 좋은 예: Named export 사용
```typescript
// 명확한 이름으로 export
export function formatDate(date: Date) { ... }
export function parseDate(str: string) { ... }
export function daysBetween(d1: Date, d2: Date) { ... }
```

```typescript
// 사용할 때
import { formatDate, parseDate } from '@myname/utils'; // 자동완성 지원
// 또는 필요한 것만 import
import { formatDate } from '@myname/utils';
```

### 2. 타입 정의

#### ❌ 나쁜 예: any 타입 사용
```typescript
export function deepClone(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}
```

#### ✅ 좋은 예: 제네릭으로 타입 안정성 제공
```typescript
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// 사용 시
const user = { name: 'John', age: 30 };
const cloned = deepClone(user); // cloned는 { name: string, age: number } 타입
```

### 3. 에러 처리

#### ❌ 나쁜 예: 조용히 실패
```typescript
export function parseJSON(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return null; // 사용자가 에러를 알 수 없음
  }
}
```

#### ✅ 좋은 예: 명확한 에러 처리
```typescript
export function parseJSON<T = unknown>(str: string): T {
  try {
    return JSON.parse(str);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
}

// 또는 Result 타입 사용
export function parseJSONSafe<T = unknown>(
  str: string
): { success: true; data: T } | { success: false; error: string } {
  try {
    return { success: true, data: JSON.parse(str) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### 4. 사이드 이펙트

#### ❌ 나쁜 예: import 시 사이드 이펙트 발생
```typescript
// src/config.ts
console.log('Config loaded!'); // import만 해도 실행됨
document.title = 'My App'; // 브라우저 환경 가정

export const config = { ... };
```

#### ✅ 좋은 예: 순수 함수만 export
```typescript
// src/config.ts
export const config = { ... }; // import해도 부작용 없음

export function setTitle(title: string) {
  // 명시적으로 호출할 때만 실행
  if (typeof document !== 'undefined') {
    document.title = title;
  }
}
```

### 5. 의존성 관리

#### ❌ 나쁜 예: 모든 것을 dependencies에
```json
{
  "dependencies": {
    "react": "^18.0.0",        // 이건 peerDependencies여야 함
    "typescript": "^5.0.0",     // 이건 devDependencies여야 함
    "jest": "^29.0.0",          // 이것도 devDependencies
    "lodash": "^4.17.21"        // 실제로 필요한 dependency
  }
}
```

#### ✅ 좋은 예: 올바른 분류
```json
{
  "dependencies": {
    "lodash": "^4.17.21"        // 런타임에 필요
  },
  "devDependencies": {
    "typescript": "^5.0.0",     // 개발/빌드에만 필요
    "jest": "^29.0.0",          // 테스트에만 필요
    "@types/node": "^20.0.0"    // 타입 정의
  },
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0"  // 사용자가 설치해야 함
  }
}
```

### 6. 파일 크기 최적화

#### ❌ 나쁜 예: 모든 것을 번들에 포함
```typescript
// src/index.ts
import lodash from 'lodash'; // 전체 lodash (70KB+)
export { default as _ } from 'lodash';

export function chunk(arr: any[], size: number) {
  return lodash.chunk(arr, size);
}
```

#### ✅ 좋은 예: 필요한 것만 import
```typescript
// src/index.ts
import chunk from 'lodash/chunk'; // 필요한 함수만 (~2KB)

export function chunkArray<T>(arr: T[], size: number): T[][] {
  return chunk(arr, size);
}
```

## 고급 활용

### Tree-shaking 최적화

Tree-shaking은 사용하지 않는 코드를 번들에서 제거하는 기술입니다.

```
Tree-shaking 작동 방식
┌────────────────────────────────┐
│  라이브러리                     │
│  ├── funcA (사용됨)            │
│  ├── funcB (사용 안 됨)        │
│  └── funcC (사용 안 됨)        │
└────────────────────────────────┘
         ↓ 사용자가 import
┌────────────────────────────────┐
│  import { funcA } from 'lib'   │
└────────────────────────────────┘
         ↓ 빌드 도구가 분석
┌────────────────────────────────┐
│  최종 번들                      │
│  └── funcA만 포함               │
│  (funcB, funcC 제거됨)          │
└────────────────────────────────┘
```

**Tree-shaking을 위한 설정:**

```json
// package.json
{
  "sideEffects": false  // 이 패키지는 부작용이 없음
}

// CSS 파일이 있다면
{
  "sideEffects": ["*.css", "*.scss"]  // CSS는 부작용이 있음
}
```

```typescript
// src/index.ts
// ✅ 좋은 예: 개별 export
export { formatDate } from './date';
export { capitalize } from './string';
export { debounce } from './function';

// ❌ 나쁜 예: 재export로 묶기
export * from './date';  // 모든 함수가 번들에 포함될 수 있음
```

### Exports 필드 활용

Node.js의 `exports` 필드로 세밀한 제어가 가능합니다.

```json
{
  "name": "@myname/utils",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./date": {
      "import": "./dist/date.mjs",
      "require": "./dist/date.cjs",
      "types": "./dist/date.d.ts"
    },
    "./string": {
      "import": "./dist/string.mjs",
      "require": "./dist/string.cjs",
      "types": "./dist/string.d.ts"
    },
    "./package.json": "./package.json"
  }
}
```

**사용자 입장에서:**
```typescript
// 전체 import
import { formatDate, capitalize } from '@myname/utils';

// 서브 경로 import (더 작은 번들)
import { formatDate } from '@myname/utils/date';
import { capitalize } from '@myname/utils/string';
```

### 로컬 개발과 테스트

배포 전에 로컬에서 테스트하는 방법들:

#### 방법 1: npm link

```bash
# 라이브러리 프로젝트에서
cd my-awesome-lib
npm link

# 테스트 프로젝트에서
cd my-test-project
npm link @myname/awesome-lib
```

#### 방법 2: file: 프로토콜

```json
// 테스트 프로젝트의 package.json
{
  "dependencies": {
    "@myname/awesome-lib": "file:../my-awesome-lib"
  }
}
```

#### 방법 3: verdaccio (로컬 npm 레지스트리)

```bash
# verdaccio 설치 및 실행
npm install -g verdaccio
verdaccio

# 라이브러리 배포
npm publish --registry http://localhost:4873

# 테스트 프로젝트에서 설치
npm install @myname/awesome-lib --registry http://localhost:4873
```

### 버전 관리 전략 (Semantic Versioning)

```
버전 형식: MAJOR.MINOR.PATCH
           1    .2    .3

MAJOR: 하위 호환되지 않는 API 변경
MINOR: 하위 호환되는 기능 추가
PATCH: 하위 호환되는 버그 수정
```

**예시:**

```typescript
// v1.0.0 - 초기 릴리스
export function add(a: number, b: number): number {
  return a + b;
}

// v1.0.1 - PATCH (버그 수정)
export function add(a: number, b: number): number {
  // 버그: NaN 처리 안 됨 → 수정
  if (isNaN(a) || isNaN(b)) {
    throw new Error('Invalid number');
  }
  return a + b;
}

// v1.1.0 - MINOR (기능 추가)
export function add(a: number, b: number): number { ... }
export function subtract(a: number, b: number): number { // 새 함수 추가
  return a - b;
}

// v2.0.0 - MAJOR (breaking change)
export function add(numbers: number[]): number { // API 변경
  return numbers.reduce((sum, n) => sum + n, 0);
}
```

```bash
# 버전 업데이트 명령어
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# 사전 릴리스 버전
npm version prerelease  # 1.0.0 → 1.0.1-0
npm version prepatch    # 1.0.0 → 1.0.1-0
npm version preminor    # 1.0.0 → 1.1.0-0
npm version premajor    # 1.0.0 → 2.0.0-0
```

### GitHub Actions로 자동 배포

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  build-and-publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**사용 흐름:**
```bash
# 1. 버전 업데이트
npm version minor

# 2. Git에 푸시
git push origin main --tags

# 3. GitHub에서 Release 생성
# → GitHub Actions가 자동으로 npm에 배포
```

### Monorepo로 여러 패키지 관리

여러 관련 패키지를 한 저장소에서 관리하는 방법:

```
monorepo 구조
my-libs/
├── packages/
│   ├── core/           (@myname/core)
│   │   ├── package.json
│   │   └── src/
│   ├── react/          (@myname/react)
│   │   ├── package.json
│   │   └── src/
│   └── utils/          (@myname/utils)
│       ├── package.json
│       └── src/
├── package.json
└── pnpm-workspace.yaml
```

**pnpm workspace 설정:**
```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

```json
// packages/react/package.json
{
  "name": "@myname/react",
  "dependencies": {
    "@myname/core": "workspace:*"  // 같은 workspace의 패키지 참조
  }
}
```

```bash
# 전체 빌드
pnpm -r build

# 전체 테스트
pnpm -r test

# 특정 패키지에서 명령 실행
pnpm --filter @myname/react build
```

## 함정과 주의사항

### 1. package.json의 files 필드를 잊음

❌ **문제:**
```json
{
  "name": "@myname/lib",
  "main": "./dist/index.js"
  // files 필드 없음!
}
```

빌드된 `dist/` 폴더가 npm에 배포되지 않아, 사용자가 설치해도 코드가 없습니다.

✅ **해결:**
```json
{
  "name": "@myname/lib",
  "main": "./dist/index.js",
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ]
}
```

**확인 방법:**
```bash
# 배포될 파일 미리 확인
npm pack --dry-run
```

### 2. 빌드하지 않고 배포

❌ **실수:**
```bash
# 소스 코드 수정
# ... 빌드 안 함 ...
npm publish  # 이전 빌드 결과가 배포됨!
```

✅ **해결:**
```json
{
  "scripts": {
    "build": "tsup src/index.ts",
    "prepublishOnly": "npm run build"  // publish 전 자동 빌드
  }
}
```

### 3. devDependencies를 dependencies에 추가

❌ **문제:**
```json
{
  "dependencies": {
    "typescript": "^5.0.0",  // 사용자도 설치하게 됨 (불필요)
    "jest": "^29.0.0"        // 사용자는 필요 없음
  }
}
```

사용자가 여러분의 라이브러리를 설치하면 불필요한 패키지들도 함께 설치됩니다.

✅ **해결:**
```json
{
  "dependencies": {
    "lodash": "^4.17.21"  // 실제로 런타임에 필요한 것만
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/lodash": "^4.14.0"
  }
}
```

### 4. React 같은 라이브러리를 dependencies에 추가

❌ **문제:**
```json
{
  "dependencies": {
    "react": "^18.0.0"  // 사용자의 React 버전과 충돌 가능
  }
}
```

사용자가 React 17을 사용하는데, 여러분의 라이브러리가 React 18을 설치하면 두 버전이 충돌합니다.

✅ **해결:**
```json
{
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0"  // 사용자가 설치한 버전 사용
  },
  "devDependencies": {
    "react": "^18.0.0"  // 개발용으로만
  }
}
```

### 5. 타입 정의 파일 누락

❌ **문제:**
```typescript
// src/index.ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

```json
// package.json
{
  "main": "./dist/index.js"
  // types 필드 없음!
}
```

TypeScript 사용자가 타입 정보를 얻을 수 없습니다.

✅ **해결:**
```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"  // 타입 정의 파일 명시
}
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "declaration": true  // .d.ts 파일 생성
  }
}
```

### 6. 테스트하지 않고 배포

배포 전 체크리스트:

```bash
# 1. 린트 확인
npm run lint

# 2. 타입 체크
npm run type-check  # tsc --noEmit

# 3. 테스트 실행
npm test

# 4. 로컬 빌드
npm run build

# 5. 배포될 파일 확인
npm pack --dry-run

# 6. 로컬 테스트
cd ../test-project
npm link ../my-lib
npm test

# 7. 배포
npm publish
```

### 7. README 작성을 소홀히 함

❌ **나쁜 README:**
```markdown
# my-lib

A library.

## Install
npm install my-lib
```

✅ **좋은 README:**
```markdown
# @myname/awesome-lib

> 유용한 유틸리티 함수 모음

## 특징
- 🚀 빠르고 가볍습니다 (gzipped 2KB)
- 📦 Tree-shaking 지원
- 💪 TypeScript로 작성됨
- ✅ 100% 테스트 커버리지

## 설치
```bash
npm install @myname/awesome-lib
```

## 빠른 시작
```typescript
import { formatDate, daysBetween } from '@myname/awesome-lib';

const today = new Date();
console.log(formatDate(today)); // "2025-10-13"

const d1 = new Date('2025-01-01');
const d2 = new Date('2025-12-31');
console.log(daysBetween(d1, d2)); // 364
```

## API 문서
### formatDate(date: Date): string
날짜를 YYYY-MM-DD 형식으로 포맷팅합니다.

...

## 라이선스
MIT © Your Name
```

### 8. 환경 가정

❌ **문제:**
```typescript
// 브라우저 환경만 가정
export function getWindowSize() {
  return {
    width: window.innerWidth,   // Node.js에서 에러!
    height: window.innerHeight
  };
}
```

✅ **해결:**
```typescript
export function getWindowSize(): { width: number; height: number } | null {
  if (typeof window === 'undefined') {
    return null;  // Node.js 환경
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

// 또는 더 명확하게
export function getWindowSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    throw new Error('getWindowSize can only be called in browser environment');
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}
```

## 실전 활용

### 사례 1: 회사 내부 디자인 시스템

```typescript
// @company/design-system
export { Button } from './components/Button';
export { Input } from './components/Input';
export { Modal } from './components/Modal';
export { theme } from './theme';

// private npm registry에 배포
npm publish --registry https://npm.company.com
```

```json
// 사용하는 프로젝트의 .npmrc
@company:registry=https://npm.company.com
```

### 사례 2: 마이크로서비스 공통 로직

```typescript
// @company/api-client
export class ApiClient {
  constructor(private baseURL: string) {}

  async get<T>(path: string): Promise<T> {
    // 공통 인증, 에러 처리, 로깅 등
  }

  async post<T>(path: string, data: unknown): Promise<T> {
    // ...
  }
}

// @company/logger
export class Logger {
  // 공통 로깅 로직
}
```

모든 마이크로서비스가 같은 버전의 클라이언트 라이브러리를 사용하여 일관성 유지.

### 사례 3: 플러그인 시스템

```typescript
// @myapp/plugin-interface
export interface Plugin {
  name: string;
  version: string;
  init(app: App): void;
  onEvent(event: Event): void;
}

// 사용자가 만드는 플러그인
// @username/myapp-plugin-awesome
import type { Plugin } from '@myapp/plugin-interface';

export const plugin: Plugin = {
  name: 'awesome-plugin',
  version: '1.0.0',
  init(app) {
    // 초기화
  },
  onEvent(event) {
    // 이벤트 처리
  }
};
```

### 사례 4: 유틸리티 라이브러리 확장

기존 라이브러리를 확장하는 패키지:

```typescript
// @myname/lodash-extras
import _ from 'lodash';

// lodash에 없는 기능 추가
export function shuffle<T>(array: T[]): T[] {
  return _.shuffle(array);  // lodash 사용
}

export function randomPick<T>(array: T[], count: number): T[] {
  return _.sampleSize(array, count);
}

// TypeScript 타입 확장
declare module 'lodash' {
  interface LoDashStatic {
    randomPick<T>(array: T[], count: number): T[];
  }
}

_.mixin({
  randomPick
});
```

## 완전한 예제: 풀스택 라이브러리 프로젝트

실제 배포 가능한 완전한 프로젝트 구조:

```
awesome-date-lib/
├── src/
│   ├── format.ts
│   ├── parse.ts
│   ├── calculate.ts
│   ├── index.ts
│   └── types.ts
├── test/
│   ├── format.test.ts
│   ├── parse.test.ts
│   └── calculate.test.ts
├── docs/
│   ├── api.md
│   └── examples.md
├── .github/
│   └── workflows/
│       └── publish.yml
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── jest.config.js
├── .npmignore
├── README.md
├── LICENSE
└── CHANGELOG.md
```

**package.json:**
```json
{
  "name": "@myname/awesome-date",
  "version": "1.0.0",
  "description": "Modern date manipulation library",
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/awesome-date-lib"
  },
  "homepage": "https://github.com/username/awesome-date-lib#readme",
  "bugs": {
    "url": "https://github.com/username/awesome-date-lib/issues"
  },
  "keywords": ["date", "datetime", "format", "parse", "utility"],
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsup",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "type-check": "tsc --noEmit",
    "prepublishOnly": "npm run lint && npm run type-check && npm run test && npm run build"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.50.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "tsup": "^8.0.0",
    "typescript": "^5.2.0"
  },
  "engines": {
    "node": ">=16"
  }
}
```

**tsup.config.ts:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
});
```

**jest.config.js:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## 참고 자료

### 공식 문서
- [npm 공식 문서 - 패키지 생성](https://docs.npmjs.com/creating-node-js-modules) - npm 패키지 생성 가이드
- [npm 공식 문서 - 배포하기](https://docs.npmjs.com/publishing-packages) - npm에 패키지 배포 방법
- [TypeScript 핸드북 - 선언 파일](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html) - 타입 정의 파일 작성과 배포
- [Node.js 패키지 exports](https://nodejs.org/api/packages.html#exports) - package.json exports 필드 설명

### 빌드 도구
- [tsup 문서](https://tsup.egoist.dev/) - 가장 쉬운 TypeScript 라이브러리 빌드 도구
- [Rollup 문서](https://rollupjs.org/) - 강력한 JavaScript 번들러
- [esbuild 문서](https://esbuild.github.io/) - 매우 빠른 JavaScript 번들러
- [Vite 라이브러리 모드](https://vitejs.dev/guide/build.html#library-mode) - Vite로 라이브러리 빌드

### 모노레포 관리
- [pnpm workspace](https://pnpm.io/workspaces) - pnpm으로 모노레포 관리
- [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces) - npm 내장 workspace 기능
- [Turborepo](https://turbo.build/repo) - 고성능 모노레포 빌드 시스템

### 테스팅
- [Jest 문서](https://jestjs.io/) - JavaScript 테스팅 프레임워크
- [Vitest 문서](https://vitest.dev/) - Vite 기반 빠른 테스트 도구
- [Testing Library](https://testing-library.com/) - React 컴포넌트 테스팅

### CI/CD
- [GitHub Actions 문서](https://docs.github.com/en/actions) - GitHub에서 CI/CD 자동화
- [Semantic Release](https://semantic-release.gitbook.io/) - 자동 버전 관리와 릴리스
- [Changesets](https://github.com/changesets/changesets) - 모노레포 버전 관리

### 유용한 도구
- [np](https://github.com/sindresorhus/np) - 더 나은 npm publish 경험
- [publint](https://publint.dev/) - package.json 문제 감지
- [arethetypeswrong](https://arethetypeswrong.github.io/) - TypeScript 타입 배포 검증
- [size-limit](https://github.com/ai/size-limit) - 번들 크기 제한 설정

### 좋은 라이브러리 예제
- [date-fns](https://github.com/date-fns/date-fns) - 모듈식 날짜 라이브러리
- [zod](https://github.com/colinhacks/zod) - TypeScript 스키마 검증
- [radash](https://github.com/rayepps/radash) - 현대적인 유틸리티 라이브러리
- [zustand](https://github.com/pmndrs/zustand) - 간단한 상태 관리

### 블로그와 튜토리얼
- [How to Create and Publish a TypeScript Package](https://blog.logrocket.com/creating-publishing-typescript-npm-package/) - LogRocket 튜토리얼
- [Publishing TypeScript packages](https://blog.logrocket.com/publishing-node-modules-typescript-es-modules/) - ES Modules 관련 상세 가이드
- [The perfect npm package](https://www.totaltypescript.com/the-perfect-npm-package) - Matt Pocock의 완벽한 패키지 가이드
