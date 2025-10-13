# Prisma ORM 가이드

## 목차
- [Prisma란?](#prisma란)
- [개념](#개념)
- [설치 및 설정](#설치-및-설정)
- [스키마 정의](#스키마-정의)
- [데이터베이스 마이그레이션](#데이터베이스-마이그레이션)
- [Prisma Client 사용법](#prisma-client-사용법)
- [쿼리 패턴](#쿼리-패턴)
- [TypeScript 통합](#typescript-통합)
- [성능 최적화](#성능-최적화)
- [실제 프로젝트 예제](#실제-프로젝트-예제)
- [베스트 프랙티스](#베스트-프랙티스)

## Prisma란?

Prisma는 **Node.js와 TypeScript를 위한 차세대 ORM(Object-Relational Mapping)**입니다. 전통적인 ORM들의 한계를 극복하고, 개발자가 데이터베이스와 상호작용할 때 겪는 다음과 같은 문제들을 해결합니다.

> **ORM이란?**<br/>
> ORM(Object-Relational Mapping)은 객체 지향 프로그래밍(Object-Oriented Programming)에서 관계형 데이터베이스 관리 시스템(Relational Database Management System)을 사용하여 데이터를 관리하는 방법입니다.

### 기존 데이터베이스 작업의 문제점
- **타입 안전성 부족**: SQL 쿼리나 기존 ORM에서 런타임 에러 발생
- **복잡한 설정**: 데이터베이스 연결, 마이그레이션, 스키마 관리의 복잡성
- **개발자 경험 저하**: 자동완성 부족, 디버깅 어려움
- **성능 문제**: N+1 쿼리 문제, 비효율적인 쿼리 생성

### Prisma가 제공하는 해결책

Prisma는 이러한 문제들을 다음 4가지 핵심 도구로 해결합니다.

### 구성요소
- **Prisma Schema**: 데이터베이스 스키마를 `.prisma` 파일로 정의 (코드)
- **Prisma Client**: 타입 안전한 데이터베이스 클라이언트 자동 생성 (코드)
- **Prisma Migrate**: 데이터베이스 마이그레이션 도구 (CLI 명령어)
- **Prisma Studio**: 데이터베이스 GUI 관리 도구 (웹 인터페이스)


### [Prisma Studio](https://www.prisma.io/studio)
Prisma의 GUI 인터페이스입니다.

![Prisma Studio](https://cdn.sanity.io/images/p2zxqf70/production/a9526606e3bd3ac55fe881d9a94e4725d33225a0-881x533.svg)

[출처](https://cdn.sanity.io)


```bash
# Prisma Studio 실행
npx prisma studio
```


브라우저에서 `http://localhost:5555`로 접속하면:
- 테이블 데이터 조회/편집
- 관계 데이터 시각화
- 실시간 데이터베이스 탐색

또는 [Prisma VSCode Extension](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma)을 사용하여 Prisma Studio를 실행할 수 있습니다.

### 주요 장점


```typescript
// 전통적인 SQL 쿼리
const users = await db.query(`
  SELECT u.*, p.title 
  FROM users u 
  LEFT JOIN posts p ON u.id = p.authorId 
  WHERE u.email = ?
`, [email]);

// Prisma Client - 타입 안전하고 직관적
const user = await prisma.user.findUnique({
  where: { email },
  include: { posts: true }
});
```


## 개념

### 1. 선언적 vs 명령적 접근법
Prisma는 **"무엇을 원하는지"만 정의**하면, **"어떻게 할지"는 Prisma가 알아서 처리**합니다.

#### 명령적(Imperative) 방식 - 단계별 명령


```typescript
// "어떻게 할지"를 단계별로 명령
// 1단계: 테이블 생성
await db.query(`CREATE TABLE users (...)`);
await db.query(`CREATE TABLE posts (...)`);

// 2단계: 인덱스 생성
await db.query(`CREATE INDEX idx_user_email ON users(email)`);

// 3단계: 외래키 제약조건 추가
await db.query(`ALTER TABLE posts ADD CONSTRAINT fk_author ...`);

// 4단계: 데이터 조회 (복잡한 JOIN)
await db.query(`
  SELECT u.*, p.title 
  FROM users u 
  LEFT JOIN posts p ON u.id = p.author_id 
  WHERE u.email = ?
`);
```


#### 선언적(Declarative) 방식 - 결과만 정의


```prisma
// "무엇을 원하는지"만 선언
model User {
  id    Int     @id @default(autoincrement())
  email String  @unique  // 자동으로 인덱스 생성됨
  name  String?
  posts Post[]           // 자동으로 관계 설정됨
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  content  String?
  author   User   @relation(fields: [authorId], references: [id])
  authorId Int    // 자동으로 외래키 제약조건 생성됨
}
```

```typescript
// 복잡한 JOIN도 간단하게
const user = await prisma.user.findUnique({
  where: { email },
  include: { posts: true }  // Prisma가 자동으로 JOIN 처리
});
```


**선언적 접근법의 장점:**
- **추상화**: 복잡한 SQL 작성 불필요
- **자동화**: 인덱스, 제약조건 자동 생성
- **일관성**: 항상 같은 방식으로 동작
- **안전성**: 타입 체크와 관계 검증 자동화

### 2. 관계형 데이터 모델링

Prisma에서 테이블 간의 관계를 정의하는 방법을 살펴보겠습니다.

#### 일대다 관계 (1:N)
한 사용자가 여러 게시글을 작성할 수 있는 관계입니다.


```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String
  posts Post[] // 배열로 표현 = "여러 개"
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  content  String
  // 관계 정의: Post는 하나의 User에 속함
  author   User   @relation(fields: [authorId], references: [id])
  authorId Int    // 외래키 필드
}
```


**실제 생성되는 SQL:**


```sql
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE "Post" (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  "authorId" INTEGER NOT NULL,
  FOREIGN KEY ("authorId") REFERENCES "User"(id)
);
```


**사용 예시:**


```typescript
// 사용자와 그의 모든 게시글 조회
const userWithPosts = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true }
});

// 게시글과 작성자 정보 조회
const postWithAuthor = await prisma.post.findUnique({
  where: { id: 1 },
  include: { author: true }
});
```


#### 일대일 관계 (1:1)
한 사용자가 하나의 프로필을 가지는 관계입니다.


```prisma
model User {
  id      Int      @id @default(autoincrement())
  email   String   @unique
  profile Profile? // ?는 선택적 관계 (nullable)
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String?
  avatar String?
  // 일대일 관계: Profile은 하나의 User에만 속함
  user   User   @relation(fields: [userId], references: [id])
  userId Int    @unique // @unique가 중요! 일대일 보장
}
```


**사용 예시:**


```typescript
// 사용자 생성과 동시에 프로필 생성
const user = await prisma.user.create({
  data: {
    email: "john@example.com",
    profile: {
      create: {
        bio: "개발자입니다",
        avatar: "avatar.jpg"
      }
    }
  },
  include: { profile: true }
});
```


#### 다대다 관계 (N:M)
게시글이 여러 카테고리에 속하고, 카테고리도 여러 게시글을 가질 수 있는 관계입니다.


```prisma
model Post {
  id         Int        @id @default(autoincrement())
  title      String
  categories Category[] // 여러 카테고리
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[] // 여러 게시글
}
```


**실제 생성되는 SQL (중간 테이블 자동 생성):**


```sql
CREATE TABLE "Post" (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL
);

CREATE TABLE "Category" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL
);

-- Prisma가 자동으로 생성하는 중간 테이블
CREATE TABLE "_CategoryToPost" (
  "A" INTEGER NOT NULL REFERENCES "Category"(id),
  "B" INTEGER NOT NULL REFERENCES "Post"(id)
);
```


**사용 예시:**


```typescript
// 게시글 생성과 동시에 카테고리 연결
const post = await prisma.post.create({
  data: {
    title: "Prisma 가이드",
    categories: {
      connect: [
        { id: 1 }, // 기존 카테고리 연결
        { id: 2 }
      ],
      create: [
        { name: "새 카테고리" } // 새 카테고리 생성 후 연결
      ]
    }
  },
  include: { categories: true }
});
```


#### 명시적 다대다 관계 (중간 테이블 커스터마이징)
중간 테이블에 추가 필드가 필요한 경우:


```prisma
model User {
  id            Int            @id @default(autoincrement())
  email         String         @unique
  postLikes     PostLike[]     // 중간 테이블을 통한 관계
}

model Post {
  id        Int        @id @default(autoincrement())
  title     String
  userLikes PostLike[] // 중간 테이블을 통한 관계
}

// 중간 테이블을 명시적으로 정의
model PostLike {
  user      User     @relation(fields: [userId], references: [id])
  userId    Int
  post      Post     @relation(fields: [postId], references: [id])
  postId    Int
  likedAt   DateTime @default(now()) // 추가 필드
  
  @@id([userId, postId]) // 복합 기본키
}
```


**사용 예시:**


```typescript
// 좋아요 추가 (시간 정보 포함)
const like = await prisma.postLike.create({
  data: {
    userId: 1,
    postId: 5
  }
});

// 사용자가 좋아요한 게시글과 시간 조회
const userLikes = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    postLikes: {
      include: { post: true },
      orderBy: { likedAt: 'desc' }
    }
  }
});
```


#### 자기 참조 관계 (Self-Relation)
댓글의 대댓글처럼 같은 테이블 내에서의 관계:


```prisma
model Comment {
  id        Int       @id @default(autoincrement())
  content   String
  // 부모 댓글 (선택적)
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  parentId  Int?
  // 자식 댓글들
  replies   Comment[] @relation("CommentReplies")
}
```


**사용 예시:**


```typescript
// 댓글과 모든 대댓글 조회
const commentWithReplies = await prisma.comment.findUnique({
  where: { id: 1 },
  include: {
    replies: {
      include: {
        replies: true // 대댓글의 대댓글까지
      }
    }
  }
});
```


## 설치 및 설정

### 1. 프로젝트 초기화


```bash
# 새 프로젝트 생성
npm init -y
npm install prisma @prisma/client
npx prisma init
```

### 2. 환경 설정
```env
# .env
DATABASE_URL="postgresql://username:password@localhost:5432/mydb"
# 또는 SQLite
DATABASE_URL="file:./dev.db"
```


### 3. 스키마 파일 구조


```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // "mysql", "sqlite", "sqlserver"
  url      = env("DATABASE_URL")
}
```


## 스키마 정의

### 1. 기본 데이터 타입


```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?  // 선택적 필드
  age       Int
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  profile   Json?    // JSON 데이터
}
```


### 2. 필드 속성


```prisma
model Product {
  id          Int     @id @default(autoincrement())
  sku         String  @unique @db.VarChar(50)
  name        String  @db.VarChar(255)
  price       Decimal @db.Decimal(10, 2)
  description String  @db.Text
  
  // 인덱스 정의
  @@index([name])
  @@index([price, createdAt])
  @@map("products") // 테이블명 매핑
}
```


### 3. 복합 관계 예제


```prisma
model User {
  id       Int       @id @default(autoincrement())
  email    String    @unique
  profile  Profile?
  posts    Post[]
  comments Comment[]
  likes    Like[]
}

model Profile {
  id     Int    @id @default(autoincrement())
  bio    String?
  avatar String?
  user   User   @relation(fields: [userId], references: [id])
  userId Int    @unique
}

model Post {
  id       Int       @id @default(autoincrement())
  title    String
  content  String
  author   User      @relation(fields: [authorId], references: [id])
  authorId Int
  comments Comment[]
  likes    Like[]
  tags     Tag[]
}

model Comment {
  id       Int  @id @default(autoincrement())
  content  String
  post     Post @relation(fields: [postId], references: [id])
  postId   Int
  author   User @relation(fields: [authorId], references: [id])
  authorId Int
}

model Like {
  user   User @relation(fields: [userId], references: [id])
  userId Int
  post   Post @relation(fields: [postId], references: [id])
  postId Int
  
  @@id([userId, postId]) // 복합 기본키
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
```


## 데이터베이스 마이그레이션

### 1. 마이그레이션 생성 및 적용


```bash
# 마이그레이션 생성
npx prisma migrate dev --name init

# 프로덕션 마이그레이션 적용
npx prisma migrate deploy

# 마이그레이션 상태 확인
npx prisma migrate status
```


### 2. 스키마 동기화


```bash
# 데이터베이스에서 스키마 가져오기
npx prisma db pull

# 스키마를 데이터베이스에 푸시 (개발용)
npx prisma db push
```


### 3. 클라이언트 재생성


```bash
# Prisma Client 생성
npx prisma generate
```


## Prisma Client 사용법

### 1. 기본 CRUD 작업


```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CREATE
const user = await prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe',
    posts: {
      create: [
        { title: 'First Post', content: 'Hello World!' },
        { title: 'Second Post', content: 'Learning Prisma' }
      ]
    }
  },
  include: { posts: true }
});

// READ
const users = await prisma.user.findMany({
  where: {
    email: { contains: '@example.com' }
  },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' }
    }
  }
});

// UPDATE
const updatedUser = await prisma.user.update({
  where: { id: 1 },
  data: {
    name: 'Jane Doe',
    posts: {
      updateMany: {
        where: { published: false },
        data: { published: true }
      }
    }
  }
});

// DELETE
await prisma.user.delete({
  where: { id: 1 }
});
```


### 2. 복잡한 쿼리 패턴


```typescript
// 조건부 필터링
const searchUsers = async (filters: {
  email?: string;
  minAge?: number;
  hasPublishedPosts?: boolean;
}) => {
  return prisma.user.findMany({
    where: {
      ...(filters.email && { email: { contains: filters.email } }),
      ...(filters.minAge && { age: { gte: filters.minAge } }),
      ...(filters.hasPublishedPosts && {
        posts: { some: { published: true } }
      })
    },
    include: {
      posts: {
        where: { published: true },
        take: 5
      },
      _count: { select: { posts: true } }
    }
  });
};

// 집계 쿼리
const userStats = await prisma.user.aggregate({
  _count: { id: true },
  _avg: { age: true },
  _max: { createdAt: true },
  where: {
    posts: { some: { published: true } }
  }
});

// 그룹화
const postsByUser = await prisma.post.groupBy({
  by: ['authorId'],
  _count: { id: true },
  _avg: { viewCount: true },
  having: {
    id: { _count: { gt: 5 } }
  }
});
```


## 쿼리 패턴

### 1. 트랜잭션 처리

트랜잭션은 **여러 데이터베이스 작업을 하나의 단위로 묶어서 처리**하는 기능입니다. 모든 작업이 성공하거나, 하나라도 실패하면 전체를 취소(롤백)합니다.

#### 왜 트랜잭션이 필요한가?

**문제 상황:**


```typescript
// ❌ 트랜잭션 없이 송금 처리
async function transferMoney(senderId, receiverId, amount) {
  // 1단계: 송금자 계좌에서 차감
  await prisma.account.update({
    where: { id: senderId },
    data: { balance: { decrement: amount } }
  });
  
  // 💥 여기서 서버가 다운되면?
  // 송금자 돈은 차감됐는데 수신자는 받지 못함!
  
  // 2단계: 수신자 계좌에 추가
  await prisma.account.update({
    where: { id: receiverId },
    data: { balance: { increment: amount } }
  });
}
```


#### 순차 트랜잭션 (Interactive Transaction)
모든 작업을 하나의 트랜잭션으로 묶어서 안전하게 처리


```typescript
// ✅ 트랜잭션으로 안전한 송금 처리
const transferMoney = await prisma.$transaction(async (tx) => {
  // 1단계: 송금자 계좌에서 차감
  const sender = await tx.account.update({
    where: { id: senderId },
    data: { balance: { decrement: amount } }
  });

  // 잔액 검증
  if (sender.balance < 0) {
    throw new Error('잔액 부족'); // 전체 트랜잭션 롤백
  }

  // 2단계: 수신자 계좌에 추가
  const receiver = await tx.account.update({
    where: { id: receiverId },
    data: { balance: { increment: amount } }
  });

  // 3단계: 거래 기록 생성
  const transactionRecord = await tx.transaction.create({
    data: {
      senderId,
      receiverId,
      amount,
      type: 'TRANSFER',
      timestamp: new Date()
    }
  });

  return { sender, receiver, transactionRecord };
});

console.log('송금 완료:', transferMoney);
```


**트랜잭션의 특징:**
- **원자성(Atomicity)**: 모든 작업이 성공하거나 모두 실패
- **일관성(Consistency)**: 데이터베이스 규칙 유지
- **격리성(Isolation)**: 다른 트랜잭션과 독립적 실행
- **지속성(Durability)**: 성공한 변경사항은 영구 저장

#### 배치 트랜잭션 (Batch Transaction)
여러 독립적인 작업을 한 번에 실행



```typescript
// 여러 작업을 배치로 처리
const batchOperations = await prisma.$transaction([
  // 새 사용자 생성
  prisma.user.create({ 
    data: { email: 'user1@example.com', name: 'User 1' } 
  }),
  prisma.user.create({ 
    data: { email: 'user2@example.com', name: 'User 2' } 
  }),
  
  // 미발행 게시글 삭제
  prisma.post.deleteMany({ 
    where: { published: false } 
  }),
  
  // 카테고리 업데이트
  prisma.category.update({
    where: { id: 1 },
    data: { name: '업데이트된 카테고리' }
  })
]);

console.log('배치 작업 결과:', batchOperations);
```


#### 트랜잭션 타임아웃 설정

트랜잭션이 너무 오래 실행되면 **데이터베이스 리소스를 독점**하고 **다른 요청을 차단**할 수 있습니다.

**문제 상황:**


```typescript
// ❌ 타임아웃 없는 위험한 트랜잭션
const result = await prisma.$transaction(async (tx) => {
  // 수백만 개의 레코드 처리 - 매우 오래 걸림
  const allUsers = await tx.user.findMany(); // 10만 개 사용자
  
  for (const user of allUsers) {
    await tx.post.create({
      data: { title: `${user.name}의 게시글`, authorId: user.id }
    }); // 각각 개별 쿼리 - 매우 비효율적
  }
  
  // 💥 이 트랜잭션이 30분 동안 실행되면?
  // - 데이터베이스 연결 고갈
  // - 다른 사용자 요청 차단
  // - 메모리 부족
});
```


**해결책: 타임아웃 설정**


```typescript
// ✅ 안전한 타임아웃 설정
const result = await prisma.$transaction(
  async (tx) => {
    // 효율적인 배치 처리
    const users = await tx.user.findMany({ take: 1000 }); // 1000개씩 제한
    
    const posts = await tx.post.createMany({
      data: users.map(user => ({
        title: `${user.name}의 게시글`,
        authorId: user.id
      }))
    }); // 한 번에 배치 처리
    
    return { users, posts };
  },
  {
    maxWait: 5000,   // 5초 내에 트랜잭션 시작 못하면 에러
    timeout: 10000,  // 10초 내에 완료 못하면 롤백
  }
);
```


**타임아웃 설정의 이유:**

1. **리소스 보호**
   - 데이터베이스 연결 풀 고갈 방지
   - 메모리 사용량 제한

2. **성능 보장**
   - 다른 사용자 요청 차단 방지
   - 시스템 전체 응답성 유지

3. **장애 방지**
   - 무한 대기 상황 방지
   - 데드락 상황에서 자동 복구

**실제 사용 예시:**


```typescript
try {
  const result = await prisma.$transaction(
    async (tx) => {
      // 복잡한 비즈니스 로직
      return await processLargeDataset(tx);
    },
    {
      maxWait: 2000,   // 2초 내에 시작
      timeout: 30000,  // 30초 내에 완료
    }
  );
} catch (error) {
  if (error.code === 'P2028') {
    console.log('트랜잭션 타임아웃 발생');
    // 재시도 로직 또는 에러 처리
  }
}
```


#### 실제 사용 사례들

**1. 주문 처리 시스템:**
```typescript
const processOrder = await prisma.$transaction(async (tx) => {
  // 재고 확인 및 차감
  const product = await tx.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } }
  });
  
  if (product.stock < 0) {
    throw new Error('재고 부족');
  }
  
  // 주문 생성
  const order = await tx.order.create({
    data: { userId, productId, quantity, total: product.price * quantity }
  });
  
  // 결제 처리
  const payment = await tx.payment.create({
    data: { orderId: order.id, amount: order.total, status: 'COMPLETED' }
  });
  
  return { order, payment, product };
});
```

**2. 게시글 좋아요 토글:**
```typescript
const toggleLike = await prisma.$transaction(async (tx) => {
  // 기존 좋아요 확인
  const existingLike = await tx.like.findUnique({
    where: { userId_postId: { userId, postId } }
  });
  
  if (existingLike) {
    // 좋아요 취소
    await tx.like.delete({
      where: { id: existingLike.id }
    });
    
    await tx.post.update({
      where: { id: postId },
      data: { likeCount: { decrement: 1 } }
    });
    
    return { action: 'unliked' };
  } else {
    // 좋아요 추가
    await tx.like.create({
      data: { userId, postId }
    });
    
    await tx.post.update({
      where: { id: postId },
      data: { likeCount: { increment: 1 } }
    });
    
    return { action: 'liked' };
  }
});
```


### 2. Raw 쿼리 사용
```typescript
// Raw SQL 쿼리
const result = await prisma.$queryRaw`
  SELECT u.name, COUNT(p.id) as post_count
  FROM "User" u
  LEFT JOIN "Post" p ON u.id = p."authorId"
  GROUP BY u.id, u.name
  HAVING COUNT(p.id) > ${minPostCount}
`;

// 타입 안전한 Raw 쿼리
interface UserPostCount {
  name: string;
  post_count: bigint;
}

const typedResult = await prisma.$queryRaw<UserPostCount[]>`
  SELECT u.name, COUNT(p.id) as post_count
  FROM "User" u
  LEFT JOIN "Post" p ON u.id = p."authorId"
  GROUP BY u.id, u.name
`;
```

### 3. 미들웨어 활용
```typescript
// 로깅 미들웨어
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
  return result;
});

// 소프트 삭제 미들웨어
prisma.$use(async (params, next) => {
  if (params.action === 'delete') {
    params.action = 'update';
    params.args['data'] = { deletedAt: new Date() };
  }
  
  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    if (params.args.data != undefined) {
      params.args.data['deletedAt'] = new Date();
    } else {
      params.args['data'] = { deletedAt: new Date() };
    }
  }
  
  return next(params);
});
```

## TypeScript 통합

### 1. 타입 안전성
```typescript
import { User, Post, Prisma } from '@prisma/client';

// 생성된 타입 사용
type UserWithPosts = User & {
  posts: Post[];
};

// Prisma 타입 유틸리티
type UserCreateInput = Prisma.UserCreateInput;
type PostWhereInput = Prisma.PostWhereInput;

// 선택적 필드 타입
type UserSelect = Prisma.UserSelect;
type PostInclude = Prisma.PostInclude;
```

### 2. 커스텀 타입 정의
```typescript
// 복잡한 쿼리 결과 타입
type UserWithPostsAndComments = Prisma.UserGetPayload<{
  include: {
    posts: {
      include: {
        comments: true;
      };
    };
  };
}>;

// 부분 선택 타입
type UserBasicInfo = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    name: true;
  };
}>;

// 제네릭 서비스 클래스
class UserService {
  constructor(private prisma: PrismaClient) {}

  async findUser<T extends Prisma.UserFindUniqueArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserFindUniqueArgs>
  ): Promise<Prisma.UserGetPayload<T> | null> {
    return this.prisma.user.findUnique(args);
  }

  async createUser<T extends Prisma.UserCreateArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserCreateArgs>
  ): Promise<Prisma.UserGetPayload<T>> {
    return this.prisma.user.create(args);
  }
}
```

### 3. 타입 가드 및 검증
```typescript
import { z } from 'zod';

// Zod 스키마로 런타임 검증
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().min(0).max(150)
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;

const createUserSafely = async (input: unknown) => {
  const validatedInput = CreateUserSchema.parse(input);
  
  return prisma.user.create({
    data: validatedInput
  });
};

// 타입 가드 함수
function isUserWithPosts(user: any): user is UserWithPosts {
  return user && Array.isArray(user.posts);
}
```

## 성능 최적화

### 1. N+1 쿼리 문제 해결
```typescript
// ❌ N+1 문제 발생
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { authorId: user.id }
  });
  console.log(`${user.name}: ${posts.length} posts`);
}

// ✅ include로 해결
const usersWithPosts = await prisma.user.findMany({
  include: { posts: true }
});

// ✅ 또는 별도 쿼리로 해결
const users = await prisma.user.findMany();
const userIds = users.map(u => u.id);
const posts = await prisma.post.findMany({
  where: { authorId: { in: userIds } }
});
```

### 2. 선택적 로딩
```typescript
// 필요한 필드만 선택
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    posts: {
      select: {
        id: true,
        title: true
      },
      take: 5
    }
  }
});

// 조건부 include
const getUserWithOptionalPosts = (includePosts: boolean) => {
  return prisma.user.findMany({
    ...(includePosts && {
      include: { posts: true }
    })
  });
};
```

### 3. 연결 풀링 및 캐싱
```typescript
// 연결 풀 설정
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=20&pool_timeout=20'
    }
  }
});

// Redis 캐싱 레이어
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

const getCachedUser = async (id: number) => {
  const cacheKey = `user:${id}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const user = await prisma.user.findUnique({
    where: { id },
    include: { posts: true }
  });
  
  if (user) {
    await redis.setex(cacheKey, 300, JSON.stringify(user)); // 5분 캐시
  }
  
  return user;
};
```

## 실제 프로젝트 예제

### 1. 블로그 API 서버
```typescript
// src/services/blog.service.ts
export class BlogService {
  constructor(private prisma: PrismaClient) {}

  async createPost(authorId: number, data: CreatePostInput) {
    return this.prisma.post.create({
      data: {
        ...data,
        author: { connect: { id: authorId } },
        tags: {
          connectOrCreate: data.tagNames?.map(name => ({
            where: { name },
            create: { name }
          }))
        }
      },
      include: {
        author: { select: { id: true, name: true } },
        tags: true,
        _count: { select: { comments: true, likes: true } }
      }
    });
  }

  async getPostsWithPagination(page: number, limit: number, filters?: PostFilters) {
    const skip = (page - 1) * limit;
    
    const where: Prisma.PostWhereInput = {
      published: true,
      ...(filters?.category && {
        tags: { some: { name: filters.category } }
      }),
      ...(filters?.search && {
        OR: [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } }
        ]
      })
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, avatar: true } },
          tags: true,
          _count: { select: { comments: true, likes: true } }
        }
      }),
      this.prisma.post.count({ where })
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
```

### 2. 사용자 인증 시스템
```typescript
// src/services/auth.service.ts
export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterInput) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('이미 존재하는 이메일입니다.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        profile: {
          create: {
            bio: data.bio || null
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        profile: true
      }
    });
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('잘못된 인증 정보입니다.');
    }

    // 로그인 기록 저장
    await this.prisma.loginLog.create({
      data: {
        userId: user.id,
        ipAddress: '127.0.0.1', // 실제로는 요청에서 가져옴
        userAgent: 'Mozilla/5.0...' // 실제로는 요청에서 가져옴
      }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile
      },
      token: this.generateJWT(user.id)
    };
  }
}
```

## 베스트 프랙티스

### 1. 스키마 설계 원칙
```prisma
// ✅ 좋은 스키마 설계
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique @db.VarChar(255)
  name      String   @db.VarChar(100)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // 관계는 명확하게 정의
  posts     Post[]
  profile   Profile?
  
  // 인덱스 최적화
  @@index([email])
  @@index([createdAt])
  @@map("users") // 테이블명 명시
}

// 열거형 사용
enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Post {
  id        Int        @id @default(autoincrement())
  title     String     @db.VarChar(255)
  content   String     @db.Text
  status    PostStatus @default(DRAFT)
  
  // 외래키 제약조건
  author    User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  Int
  
  @@index([status, createdAt])
}
```

### 2. 에러 처리 패턴
```typescript
// 커스텀 에러 클래스
export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// 에러 처리 래퍼
export const handlePrismaError = (error: any): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        throw new DatabaseError('중복된 값입니다.', 'DUPLICATE_VALUE');
      case 'P2025':
        throw new DatabaseError('레코드를 찾을 수 없습니다.', 'NOT_FOUND');
      default:
        throw new DatabaseError('데이터베이스 오류가 발생했습니다.', error.code);
    }
  }
  throw error;
};

// 서비스에서 사용
export class UserService {
  async createUser(data: CreateUserInput) {
    try {
      return await this.prisma.user.create({ data });
    } catch (error) {
      handlePrismaError(error);
    }
  }
}
```

### 3. 테스팅 전략
```typescript
// 테스트 데이터베이스 설정
// tests/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL }
  }
});

export const resetDatabase = async () => {
  await prisma.$transaction([
    prisma.post.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};

// 통합 테스트 예제
// tests/user.service.test.ts
describe('UserService', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('should create user with profile', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      profile: {
        create: { bio: 'Test bio' }
      }
    };

    const user = await userService.createUser(userData);

    expect(user.email).toBe(userData.email);
    expect(user.profile).toBeDefined();
    expect(user.profile?.bio).toBe('Test bio');
  });

  it('should throw error for duplicate email', async () => {
    await userService.createUser({
      email: 'test@example.com',
      name: 'User 1'
    });

    await expect(
      userService.createUser({
        email: 'test@example.com',
        name: 'User 2'
      })
    ).rejects.toThrow('중복된 값입니다.');
  });
});
```

### 4. 프로덕션 고려사항
```typescript
// 연결 관리
export const createPrismaClient = () => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL + '?connection_limit=10&pool_timeout=20'
      }
    }
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
  });

  return prisma;
};

// 헬스체크 엔드포인트
export const healthCheck = async (prisma: PrismaClient) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', database: 'connected' };
  } catch (error) {
    return { status: 'unhealthy', database: 'disconnected', error };
  }
};
```

## 참고 자료

### 공식 문서
- [Prisma 공식 문서](https://www.prisma.io/docs) - 가장 최신의 정보와 상세한 가이드
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference) - 스키마 문법 완전 가이드
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference) - 클라이언트 API 레퍼런스
- [Prisma Migrate Reference](https://www.prisma.io/docs/reference/api-reference/command-reference#prisma-migrate) - 마이그레이션 명령어 가이드

### 튜토리얼 및 가이드
- [Prisma Getting Started](https://www.prisma.io/docs/getting-started) - 빠른 시작 가이드
- [Database Connectors](https://www.prisma.io/docs/concepts/database-connectors) - 데이터베이스별 연결 가이드
- [Prisma with Next.js](https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices) - Next.js 통합 가이드
- [Prisma with TypeScript](https://www.prisma.io/docs/concepts/more/comparisons/prisma-and-typeorm#type-safety) - TypeScript 활용법

### 커뮤니티 및 도구
- [Prisma GitHub Repository](https://github.com/prisma/prisma) - 소스코드 및 이슈 트래킹
- [Prisma Community](https://www.prisma.io/community) - 커뮤니티 리소스
- [Prisma Examples](https://github.com/prisma/prisma-examples) - 다양한 프레임워크별 예제
- [Prisma Studio](https://www.prisma.io/studio) - 데이터베이스 GUI 도구

### 관련 도구 및 라이브러리
- [Zod](https://zod.dev/) - 런타임 타입 검증 라이브러리
- [tRPC](https://trpc.io/) - 타입 안전한 API 구축
- [Nexus](https://nexusjs.org/) - GraphQL 스키마 구축 도구
- [Pothos GraphQL](https://pothos-graphql.dev/) - GraphQL 스키마 빌더

### 성능 및 모니터링
- [Prisma Accelerate](https://www.prisma.io/data-platform/accelerate) - 연결 풀링 및 캐싱 서비스
- [Prisma Pulse](https://www.prisma.io/data-platform/pulse) - 실시간 데이터베이스 이벤트
- [DataDog Prisma Integration](https://docs.datadoghq.com/integrations/prisma/) - 성능 모니터링
- [New Relic Database Monitoring](https://newrelic.com/products/database-monitoring) - 데이터베이스 성능 추적

### 블로그 및 아티클
- [Prisma Blog](https://www.prisma.io/blog) - 최신 업데이트 및 기술 아티클
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance) - 성능 최적화 가이드
- [Database Schema Design Best Practices](https://www.prisma.io/dataguide/datamodeling) - 스키마 설계 가이드

## 마무리

Prisma는 현대적인 웹 애플리케이션 개발에서 데이터베이스 작업을 크게 단순화하고 안전하게 만들어주는 강력한 도구입니다. 타입 안전성, 직관적인 API, 그리고 뛰어난 개발자 경험을 제공하여 생산성을 크게 향상시킬 수 있습니다.

### 핵심 포인트
- **타입 안전성**: 컴파일 타임에 데이터베이스 오류 방지
- **개발자 경험**: 자동완성, 인텔리센스 지원
- **성능**: 효율적인 쿼리 생성 및 최적화
- **유지보수성**: 스키마 중심의 선언적 개발

Prisma를 활용하여 더 안전하고 효율적인 데이터베이스 애플리케이션을 개발해보세요!
