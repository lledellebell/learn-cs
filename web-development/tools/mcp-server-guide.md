---
title: MCP 서버 생성 가이드 - AI 에이전트를 위한 커스텀 도구 만들기
description: Model Context Protocol(MCP) 서버를 처음부터 만드는 완전한 가이드
date: 2025-10-15
categories: [Web Development, Tools]
tags: [MCP, AI, Development, Tools, Protocol]
layout: page
category: web-development
topic: tools
difficulty: intermediate
---
# MCP 서버 생성 가이드

AI 에이전트와 작업하다 보면 이런 생각이 들 때가 있습니다. "내 프로젝트의 특정 파일을 자동으로 읽고 쓸 수 있으면 좋을 텐데..." 또는 "반복적인 작업을 AI가 직접 처리할 수 있다면..."

MCP(Model Context Protocol) 서버는 바로 이런 상황을 위해 만들어졌습니다. 이 가이드에서는 처음부터 MCP 서버를 만드는 모든 과정을 다룹니다.

## 목차
1. [MCP 서버란 무엇인가?](#mcp-서버란-무엇인가)
2. [개발 환경 설정](#개발-환경-설정)
3. [첫 번째 MCP 서버 만들기](#첫-번째-mcp-서버-만들기)
4. [Tool 구현하기](#tool-구현하기)
5. [AI 클라이언트 연결](#ai-클라이언트-연결)
6. [실전 예제: 번역 API MCP 서버](#실전-예제-번역-api-mcp-서버)
7. [디버깅과 문제 해결](#디버깅과-문제-해결)
8. [고급 기능](#고급-기능)

## MCP 서버란 무엇인가?

### 왜 MCP 서버가 필요한가?

AI 에이전트는 매우 강력하지만, 기본적으로는 파일 시스템, 데이터베이스, API 등에 직접 접근할 수 없습니다. MCP 서버는 AI와 외부 리소스 사이의 **안전한 다리** 역할을 합니다.

```
┌─────────────┐         MCP Protocol        ┌──────────────┐
│  AI Client  │ ◄──────────────────────────► │  MCP 서버    │
│  (Claude,   │   (JSON-RPC over stdio)      │              │
│   GPT 등)   │                               │              │
└─────────────┘                               └──────┬───────┘
                                                     │
                                                     ├─► 파일 시스템
                                                     ├─► 데이터베이스
                                                     ├─► API 호출
                                                     └─► 기타 리소스
```

### 실제 활용 사례

**1. 번역 API 통합**
- 다국어 번역 자동화
- 실시간 언어 감지
- 번역 히스토리 저장

**2. 환율 조회 서비스**
- 실시간 환율 정보 제공
- 통화 변환 계산
- 환율 추이 분석

**3. 날씨 정보 서비스**
- 현재 날씨 조회
- 주간 예보 제공
- 위치 기반 날씨 알림

## 개발 환경 설정

### 필수 요구사항

- **Node.js**: v18 이상
- **TypeScript**: v5 이상
- **MCP 클라이언트**: Claude Desktop, Claude Code, 또는 MCP 지원 AI 도구

### 프로젝트 구조 설정

```bash
# 1. 프로젝트 디렉토리 생성
mkdir my-mcp-server
cd my-mcp-server

# 2. npm 프로젝트 초기화
npm init -y

# 3. 필수 패키지 설치
npm install @modelcontextprotocol/sdk

# 4. TypeScript 개발 도구 설치
npm install -D typescript @types/node

# 5. TypeScript 설정
npx tsc --init
```

### package.json 설정

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  }
}
```

### tsconfig.json 설정

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## 첫 번째 MCP 서버 만들기

### 기본 서버 구조

`src/index.ts` 파일을 생성하고 다음 코드로 시작합니다:

```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// 1. 서버 초기화
const server = new Server(
  {
    name: "my-first-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},  // Tool 기능 활성화
    },
  }
);

// 2. Tool 목록 정의
const tools: Tool[] = [
  {
    name: "hello_world",
    description: "간단한 인사 메시지를 반환합니다",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "인사할 이름",
        },
      },
      required: ["name"],
    },
  },
];

// 3. Tool 목록 요청 핸들러
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// 4. Tool 실행 핸들러
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error("Arguments are required");
  }

  try {
    switch (name) {
      case "hello_world": {
        const userName = args.name as string;
        const message = `안녕하세요, ${userName}님! MCP 서버가 정상 작동 중입니다.`;

        return {
          content: [{ type: "text", text: message }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// 5. 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("My First MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
```

### 빌드 및 테스트

```bash
# TypeScript 컴파일
npm run build

# 서버 직접 실행 테스트
node dist/index.js
# "My First MCP Server running on stdio" 메시지가 나오면 성공
```

## Tool 구현하기

### Tool의 구조

MCP Tool은 3가지 핵심 요소로 구성됩니다:

1. **name**: Tool의 고유 식별자
2. **description**: AI 에이전트에게 Tool의 목적을 설명
3. **inputSchema**: 입력 파라미터의 JSON Schema 정의

```typescript
{
  name: "get_user_info",
  description: "사용자 ID로 사용자 정보를 조회합니다",
  inputSchema: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        description: "조회할 사용자의 ID",
      },
      includeStats: {
        type: "boolean",
        description: "통계 정보 포함 여부",
        default: false,
      },
    },
    required: ["userId"],  // 필수 파라미터
  },
}
```

### 실용적인 Tool 예제: 파일 읽기

```typescript
import { promises as fs } from "fs";
import path from "path";

// Tool 정의
{
  name: "read_project_file",
  description: "프로젝트 디렉토리 내의 파일을 읽습니다",
  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "읽을 파일의 상대 경로",
      },
    },
    required: ["filePath"],
  },
}

// Tool 핸들러
case "read_project_file": {
  const filePath = args.filePath as string;
  const projectRoot = process.cwd();
  const fullPath = path.join(projectRoot, filePath);

  // ✅ 보안: 경로 검증 (필수!)
  if (!fullPath.startsWith(projectRoot)) {
    throw new Error("Access denied: Path outside project directory");
  }

  try {
    const content = await fs.readFile(fullPath, "utf-8");
    return {
      content: [{ type: "text", text: content }],
    };
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}
```

### 복잡한 Tool 예제: JSON 데이터 조작

```typescript
import { promises as fs } from "fs";

// Tool 정의
{
  name: "update_learning_history",
  description: "학습 히스토리에 새로운 항목을 추가합니다",
  inputSchema: {
    type: "object",
    properties: {
      documentId: {
        type: "string",
        description: "문서 ID",
      },
      action: {
        type: "string",
        enum: ["completed", "reviewed", "bookmarked"],
        description: "수행한 액션",
      },
      notes: {
        type: "string",
        description: "추가 노트 (선택사항)",
      },
    },
    required: ["documentId", "action"],
  },
}

// Tool 핸들러
case "update_learning_history": {
  const { documentId, action, notes } = args;
  const historyPath = path.join(process.cwd(), ".learning-history.json");

  // 파일 읽기
  let history: any = {};
  try {
    const content = await fs.readFile(historyPath, "utf-8");
    history = JSON.parse(content);
  } catch (error) {
    // 파일이 없으면 새로 생성
    history = { items: [] };
  }

  // 데이터 업데이트
  const newEntry = {
    documentId,
    action,
    timestamp: new Date().toISOString(),
    notes: notes || undefined,
  };

  history.items = history.items || [];
  history.items.push(newEntry);

  // 파일 쓰기
  await fs.writeFile(
    historyPath,
    JSON.stringify(history, null, 2),
    "utf-8"
  );

  return {
    content: [{
      type: "text",
      text: `✅ ${action} 액션이 ${documentId}에 기록되었습니다.`,
    }],
  };
}
```

### Tool 작성 시 주의사항

**❌ 피해야 할 것들:**

```typescript
// 1. 경로 검증 없이 파일 접근
case "read_file": {
  const filePath = args.filePath;
  // ❌ 위험: ../../../etc/passwd 같은 경로 허용
  const content = await fs.readFile(filePath, "utf-8");
}

// 2. 에러 처리 없음
case "dangerous_operation": {
  // ❌ try-catch 없이 실행
  await someRiskyOperation();
}

// 3. 불명확한 description
{
  name: "do_stuff",
  description: "뭔가를 합니다",  // ❌ AI가 언제 사용해야 할지 모름
}
```

**✅ 올바른 방법:**

```typescript
// 1. 경로 검증
case "read_file": {
  const filePath = args.filePath;
  const projectRoot = process.cwd();
  const fullPath = path.resolve(projectRoot, filePath);

  // ✅ 보안 체크
  if (!fullPath.startsWith(projectRoot)) {
    throw new Error("Access denied");
  }

  const content = await fs.readFile(fullPath, "utf-8");
}

// 2. 적절한 에러 처리
case "safe_operation": {
  try {
    await someOperation();
    return { content: [{ type: "text", text: "Success" }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
}

// 3. 명확한 description
{
  name: "analyze_code",
  description: "JavaScript/TypeScript 코드의 복잡도를 분석하고 개선 제안을 제공합니다. 파일 경로를 입력받아 코드 품질 리포트를 생성합니다.",
}
```

## AI 클라이언트 연결

MCP 서버를 만들었다면, 이제 AI 클라이언트에 연결해야 합니다. 연결 방법은 클라이언트마다 다릅니다.

### MCP 클라이언트 설정 방법

대부분의 MCP 클라이언트는 JSON 설정 파일을 사용합니다:

```json
{
  "mcpServers": {
    "my-server-name": {
      "command": "node",
      "args": [
        "/absolute/path/to/my-mcp-server/dist/index.js"
      ],
      "cwd": "/absolute/path/to/project"
    }
  }
}
```

**중요 포인트:**

- **절대 경로 사용**: `~/` 같은 상대 경로는 작동하지 않습니다
- **cwd 설정**: 프로젝트 루트 디렉토리 (파일 접근 시 기준 경로)
- **여러 서버 등록 가능**: `mcpServers` 객체에 여러 서버 추가

### 여러 MCP 서버 동시 사용 예시

```json
{
  "mcpServers": {
    "translator": {
      "command": "node",
      "args": [
        "/Users/username/projects/mcp-servers/translator/dist/index.js"
      ],
      "env": {
        "DEEPL_API_KEY": "your-api-key"
      }
    },
    "currency-exchange": {
      "command": "node",
      "args": [
        "/Users/username/projects/mcp-servers/currency-exchange/dist/index.js"
      ]
    },
    "weather-info": {
      "command": "node",
      "args": [
        "/Users/username/projects/mcp-servers/weather-info/dist/index.js"
      ],
      "env": {
        "WEATHER_API_KEY": "your-weather-key"
      }
    }
  }
}
```

### 환경 변수 설정

민감한 정보는 환경 변수로 관리할 수 있습니다:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/server/dist/index.js"],
      "env": {
        "API_KEY": "your-secret-key",
        "PROJECT_ROOT": "/path/to/project"
      }
    }
  }
}
```

## 실전 예제: 번역 API MCP 서버

이제 실제로 유용한 MCP 서버를 만들어봅시다. 이 서버는 DeepL API를 사용하여 텍스트를 번역하고 언어를 감지합니다.

### 프로젝트 설정

```bash
mkdir translator-mcp
cd translator-mcp
npm init -y
npm install @modelcontextprotocol/sdk
npm install -D typescript @types/node
```

### 전체 구현 코드

```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// 지원 언어 목록
const SUPPORTED_LANGUAGES = {
  EN: "영어",
  KO: "한국어",
  JA: "일본어",
  ZH: "중국어",
  ES: "스페인어",
  FR: "프랑스어",
  DE: "독일어",
  IT: "이탈리아어",
  PT: "포르투갈어",
  RU: "러시아어",
};

// Tools 정의
const tools: Tool[] = [
  {
    name: "translate_text",
    description: "텍스트를 지정된 언어로 번역합니다. DeepL API를 사용합니다.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "번역할 텍스트",
        },
        targetLang: {
          type: "string",
          enum: Object.keys(SUPPORTED_LANGUAGES),
          description: "목표 언어 코드 (EN, KO, JA 등)",
        },
        sourceLang: {
          type: "string",
          description: "원본 언어 코드 (선택사항, 자동 감지)",
        },
      },
      required: ["text", "targetLang"],
    },
  },
  {
    name: "detect_language",
    description: "텍스트의 언어를 자동으로 감지합니다",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "언어를 감지할 텍스트",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "get_supported_languages",
    description: "지원하는 언어 목록을 반환합니다",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// 서버 초기화
const server = new Server(
  {
    name: "translator-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool 핸들러
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error("Arguments are required");
  }

  try {
    switch (name) {
      case "translate_text": {
        const { text, targetLang, sourceLang } = args;
        const result = await translateText(
          text as string,
          targetLang as string,
          sourceLang as string | undefined
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "detect_language": {
        const text = args.text as string;
        const result = await detectLanguage(text);
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "get_supported_languages": {
        const languages = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
          code,
          name,
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(languages, null, 2) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// 번역 함수 (DeepL API 호출)
async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<any> {
  const apiKey = process.env.DEEPL_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPL_API_KEY 환경 변수가 설정되지 않았습니다");
  }

  const url = "https://api-free.deepl.com/v2/translate";
  const params = new URLSearchParams({
    auth_key: apiKey,
    text: text,
    target_lang: targetLang,
  });

  if (sourceLang) {
    params.append("source_lang", sourceLang);
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error(`DeepL API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      originalText: text,
      translatedText: data.translations[0].text,
      detectedSourceLang: data.translations[0].detected_source_language,
      targetLang: targetLang,
    };
  } catch (error) {
    throw new Error(`번역 실패: ${error.message}`);
  }
}

// 언어 감지 함수
async function detectLanguage(text: string): Promise<any> {
  // 간단한 휴리스틱 기반 언어 감지 (실제로는 더 정교한 라이브러리 사용 권장)
  const hasKorean = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text);
  const hasJapanese = /[ぁ-んァ-ン]/.test(text);
  const hasChinese = /[\u4e00-\u9fa5]/.test(text);
  const hasCyrillic = /[а-яА-ЯЁё]/.test(text);

  let detectedLang = "EN"; // 기본값
  let confidence = 0.5;

  if (hasKorean) {
    detectedLang = "KO";
    confidence = 0.9;
  } else if (hasJapanese) {
    detectedLang = "JA";
    confidence = 0.9;
  } else if (hasChinese) {
    detectedLang = "ZH";
    confidence = 0.9;
  } else if (hasCyrillic) {
    detectedLang = "RU";
    confidence = 0.8;
  }

  return {
    text: text.substring(0, 100), // 처음 100자만 표시
    detectedLanguage: detectedLang,
    languageName: SUPPORTED_LANGUAGES[detectedLang] || "알 수 없음",
    confidence: confidence,
    note: "더 정확한 감지를 위해서는 translate_text의 자동 감지 사용 권장",
  };
}

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Translator MCP Server running");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
```

### API 키 설정

DeepL API 무료 키를 받으세요: https://www.deepl.com/pro-api

MCP 클라이언트 설정에 API 키 추가:

```json
{
  "mcpServers": {
    "translator": {
      "command": "node",
      "args": ["/path/to/translator-mcp/dist/index.js"],
      "env": {
        "DEEPL_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### 사용 예시

AI 클라이언트에서:

```
사용자: "Hello, how are you?"를 한국어로 번역해줘

AI: (translate_text 도구 사용)

번역 결과:
{
  "originalText": "Hello, how are you?",
  "translatedText": "안녕하세요, 어떻게 지내세요?",
  "detectedSourceLang": "EN",
  "targetLang": "KO"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

사용자: 이 문장이 무슨 언어인지 알려줘: "こんにちは"

AI: (detect_language 도구 사용)

언어 감지 결과:
{
  "text": "こんにちは",
  "detectedLanguage": "JA",
  "languageName": "일본어",
  "confidence": 0.9
}
```

## 디버깅과 문제 해결

### 일반적인 문제들

#### 1. MCP 서버가 시작되지 않음

**증상:**
```
AI 클라이언트에서 도구가 보이지 않음
```

**해결 방법:**

```bash
# 1. 빌드 확인
cd /path/to/mcp-server
npm run build

# 2. 수동 실행 테스트
node dist/index.js
# 에러 메시지 확인

# 3. 경로 확인
# 설정 파일의 경로가 정확한지 확인
ls -la /absolute/path/to/mcp-server/dist/index.js
```

#### 2. Tool이 실행되지 않음

**증상:**
```
AI가 도구를 사용하려 하지만 실패
```

**해결 방법:**

```typescript
// 디버깅 로그 추가
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // ✅ 요청 로깅
  console.error("Tool called:", request.params.name);
  console.error("Arguments:", JSON.stringify(request.params.arguments));

  try {
    // ... 기존 코드 ...
  } catch (error) {
    // ✅ 에러 로깅
    console.error("Tool error:", error);
    throw error;
  }
});
```

#### 3. 파일 접근 오류

**증상:**
```
Error: ENOENT: no such file or directory
```

**해결 방법:**

```typescript
// ✅ cwd 확인 및 절대 경로 사용
console.error("Current working directory:", process.cwd());

const projectRoot = process.cwd();
const filePath = path.resolve(projectRoot, args.filePath);

console.error("Trying to read:", filePath);
```

### 로그 확인 방법

MCP 서버의 로그는 클라이언트에 따라 다른 위치에 저장됩니다. 일반적으로 애플리케이션 로그 디렉토리를 확인하세요.

**디버깅 팁:**

```typescript
// ✅ console.error 사용 (stdout은 MCP 통신에 사용됨)
console.error("Debug info:", someValue);

// ❌ console.log 사용하지 마세요
console.log("This will break MCP protocol");
```

**중요**: MCP 프로토콜은 stdin/stdout을 통해 통신하므로, 디버깅 로그는 반드시 `console.error`를 사용해야 합니다.

## 고급 기능

### 1. Resources 제공

Tool 외에도 Resources를 제공하여 AI가 문서나 데이터를 직접 읽을 수 있게 할 수 있습니다.

```typescript
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Capabilities에 resources 추가
const server = new Server(
  { name: "my-server", version: "1.0.0" },
  {
    capabilities: {
      tools: {},
      resources: {},  // Resources 기능 활성화
    },
  }
);

// Resource 목록 핸들러
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "file:///learning-history.json",
        name: "학습 히스토리",
        description: "사용자의 학습 진행 상황",
        mimeType: "application/json",
      },
    ],
  };
});

// Resource 읽기 핸들러
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  if (uri === "file:///learning-history.json") {
    const content = await fs.readFile(".learning-history.json", "utf-8");
    return {
      contents: [{
        uri,
        mimeType: "application/json",
        text: content,
      }],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});
```

### 2. Prompts 제공

자주 사용하는 프롬프트를 미리 정의할 수 있습니다.

```typescript
import { ListPromptsRequestSchema, GetPromptRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Prompts 목록
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "analyze-code",
        description: "코드 품질 분석",
        arguments: [
          {
            name: "filePath",
            description: "분석할 파일 경로",
            required: true,
          },
        ],
      },
    ],
  };
});

// Prompt 가져오기
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "analyze-code") {
    const filePath = args?.filePath as string;
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `${filePath} 파일의 코드 품질을 분석해주세요. 다음 관점에서 검토해주세요:
1. 코드 복잡도
2. 명명 규칙
3. 에러 처리
4. 보안 이슈
5. 개선 제안`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});
```


### 3. 비동기 작업 처리

오래 걸리는 작업은 적절히 처리:

```typescript
case "scan_all_files": {
  // ✅ 진행 상황 로깅
  console.error("Scanning files...");

  const files = await glob("**/*.md");
  console.error(`Found ${files.length} files`);

  const results = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.error(`Processing ${i + 1}/${files.length}: ${file}`);

    const content = await fs.readFile(file, "utf-8");
    results.push(processFile(content));
  }

  return {
    content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
  };
}
```

## 모범 사례 (Best Practices)

### 1. Tool 설계

**✅ DO:**
- 단일 책임 원칙: 각 Tool은 하나의 명확한 목적
- 명확한 이름: `get_user_by_id` (O) vs `do_stuff` (X)
- 상세한 description: AI가 언제 사용할지 이해할 수 있도록
- 적절한 파라미터 검증

**❌ DON'T:**
- 너무 많은 파라미터 (5개 초과)
- 선택적 파라미터 남용
- 모호한 반환 값

### 2. 에러 처리

```typescript
// ✅ 좋은 예
try {
  const result = await someOperation();
  return {
    content: [{ type: "text", text: JSON.stringify(result) }],
  };
} catch (error) {
  // 사용자 친화적 에러 메시지
  const message = error instanceof Error
    ? `작업 실패: ${error.message}`
    : "알 수 없는 오류가 발생했습니다";

  // 디버깅용 로그
  console.error("Operation failed:", error);

  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}
```

### 3. 보안

```typescript
// ✅ 경로 검증
function validatePath(filePath: string): string {
  const projectRoot = process.cwd();
  const fullPath = path.resolve(projectRoot, filePath);

  if (!fullPath.startsWith(projectRoot)) {
    throw new Error("Access denied: Path outside project directory");
  }

  return fullPath;
}

// ✅ 파일 타입 제한
const allowedExtensions = [".md", ".json", ".txt"];
const ext = path.extname(filePath).toLowerCase();

if (!allowedExtensions.includes(ext)) {
  throw new Error(`File type not allowed: ${ext}`);
}
```

### 4. 성능

```typescript
// ✅ 캐싱
const cache = new Map<string, any>();

case "expensive_operation": {
  const cacheKey = args.someParam as string;

  if (cache.has(cacheKey)) {
    console.error("Returning cached result");
    return {
      content: [{ type: "text", text: cache.get(cacheKey) }],
    };
  }

  const result = await doExpensiveWork();
  cache.set(cacheKey, result);

  return {
    content: [{ type: "text", text: result }],
  };
}
```

## 실전 프로젝트 아이디어

### 1. 프로젝트 관리 MCP 서버

**기능:**
- TODO 항목 추가/삭제/조회
- 마일스톤 추적
- 시간 추적

**Tools:**
- `add_todo`
- `list_todos`
- `update_todo_status`
- `get_project_stats`

### 2. 코드 리뷰 MCP 서버

**기능:**
- 코드 복잡도 분석
- 보안 취약점 스캔
- 스타일 가이드 체크

**Tools:**
- `analyze_complexity`
- `check_security`
- `lint_code`

### 3. 데이터베이스 MCP 서버

**기능:**
- 스키마 조회
- 안전한 쿼리 실행 (읽기 전용)
- 데이터 시각화

**Tools:**
- `list_tables`
- `describe_table`
- `query_data` (SELECT만 허용)

## 결론

### 핵심 요약

1. **MCP 서버는 AI의 슈퍼파워**: 파일 시스템, API, 데이터베이스 등 모든 것에 접근 가능
2. **Tool 중심 설계**: 각 Tool은 명확한 목적과 설명이 필요
3. **보안은 필수**: 경로 검증, 입력 검증, 권한 제한
4. **에러 처리**: 사용자 친화적 메시지 + 디버깅 로그

### 실전 가이드라인

MCP 서버를 만들 때:

1. **작게 시작하세요**: 단순한 Tool 하나부터
2. **반복적으로 개선**: 사용하면서 필요한 기능 추가
3. **문서화**: description을 상세히 작성
4. **테스트**: 수동 실행으로 먼저 검증

### 다음 단계

- [MCP 공식 문서](https://modelcontextprotocol.io/) 탐색
- [SDK 소스 코드](https://github.com/modelcontextprotocol/typescript-sdk) 읽기
- 커뮤니티에서 다른 MCP 서버 예제 찾기
- 직접 유용한 MCP 서버 만들어보기

이제 여러분만의 MCP 서버를 만들 준비가 되었습니다. 시작은 간단하지만, 가능성은 무한합니다!

## 참고 자료

### 공식 문서
- [Model Context Protocol 공식 사이트](https://modelcontextprotocol.io/)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP 스펙 문서](https://spec.modelcontextprotocol.io/)

### 예제 프로젝트
- [Anthropic 공식 MCP Servers](https://github.com/modelcontextprotocol/servers)
- 이 가이드의 예제 코드들

### 커뮤니티
- [MCP Discord](https://discord.gg/modelcontextprotocol)
- [GitHub Discussions](https://github.com/modelcontextprotocol/typescript-sdk/discussions)
