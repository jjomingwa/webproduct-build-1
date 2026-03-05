# 📋 web_project_1 리서치 보고서
> **작성일**: 2026-03-05  
> **목적**: MCP(Model Context Protocol) 도입으로 인해 불필요해진 Supabase/Cloudflare R2 자동화 시스템을 식별하고, 삭제 가능한 파일/폴더의 근거를 상세히 설명한다.

---

## 1. 프로젝트 전체 구조 개요

```
web_project_1/
├── r2-supabase-sync/          ← [분석 대상] Cloudflare Worker 자동화 서버
│   ├── src/index.ts           ← Worker 핵심 로직
│   ├── scripts/setup-supabase.sql  ← r2_files 테이블 생성 SQL
│   ├── wrangler.toml          ← Cloudflare 배포 설정
│   ├── package.json           ← Worker 전용 의존성
│   └── node_modules/          ← Worker 전용 패키지
│
├── recipe-git/                ← [메인 앱] React + Vite + TypeScript
│   ├── src/
│   │   ├── lib/
│   │   │   ├── supabase.ts    ← Supabase 클라이언트 초기화
│   │   │   └── gemini.ts      ← Gemini AI API 클라이언트
│   │   ├── hooks/
│   │   │   ├── useRecipeGit.ts  ← Git 핵심 비즈니스 로직
│   │   │   └── useRecipeAI.ts   ← AI 분석 훅
│   │   ├── schemas/
│   │   │   └── recipeSchema.ts  ← Zod 런타임 검증 스키마
│   │   ├── utils/
│   │   │   └── uploadToR2.ts  ← [분석 대상] R2 이미지 업로드 유틸리티
│   │   ├── components/        ← UI 컴포넌트
│   │   └── pages/             ← 페이지 컴포넌트
│   ├── scripts/setup-db.sql   ← 핵심 DB 스키마 (recipes, commits, branches 등)
│   └── .env                   ← 환경 변수 (R2 관련 포함)
│
├── package.json               ← 루트 워크스페이스 설정
├── CODE_EXPLANATION.md        ← 프로젝트 설명 문서
└── GEMINI.md                  ← AI 작업 규칙 문서
```

---

## 2. `r2-supabase-sync/` — Cloudflare Worker 자동화 시스템 심층 분석

### 2-1. 탄생 배경과 목적

이 폴더는 **"Cloudflare R2에 이미지를 업로드할 때, Supabase DB에도 자동으로 메타데이터를 기록한다"**는 자동화 파이프라인을 구현하기 위해 만들어진 **독립적인 Cloudflare Worker 서버**이다.

### 2-2. 시스템 동작 방식 (플로우)

```
[프론트엔드 (recipe-git)]
    │
    │  HTTP PUT /recipes/{id}/{commit}/step_1.jpg
    │  + Content-Type: image/jpeg
    ▼
[Cloudflare Worker (r2-supabase-sync/src/index.ts)]
    │
    ├─① R2 버킷에 파일 저장
    │   env.MY_R2_BUCKET.put(key, fileContent)
    │
    └─② Supabase 'r2_files' 테이블에 메타데이터 삽입
        supabase.from('r2_files').insert({
          file_key, file_url, file_size, content_type, metadata
        })
```

### 2-3. 파일별 상세 역할

#### `src/index.ts` (113줄)
- **역할**: Worker의 HTTP 요청 핸들러
- **지원 메서드**: `PUT`(업로드), `GET`(파일 조회)
- **핵심 로직**:
  - `PUT` 요청 → `env.MY_R2_BUCKET.put()` → `supabase.from('r2_files').insert()` 순으로 파일 저장 및 DB 기록 동기화
  - `GET` 요청 → `env.MY_R2_BUCKET.get()` → 파일 반환
- **문제점**: `wrangler.toml`의 모든 설정값이 **`TODO` 플레이스홀더**로 채워져 있어, 실제로 배포된 적이 없거나 설정이 완성되지 않은 상태

#### `scripts/setup-supabase.sql` (33줄)
- **역할**: `r2_files` 테이블과 RLS 정책 생성
- **생성 테이블**: `public.r2_files` (id, file_key, file_url, file_size, content_type, uploaded_at, metadata)
- **중요**: 이 테이블은 **핵심 앱인 `recipe-git`의 어떤 코드에서도 사용하지 않는다**. `recipe-git`의 Supabase 쿼리는 `recipes`, `recipe_commits`, `recipe_branches`, `profiles` 테이블만 사용한다.

#### `wrangler.toml` (26줄)
- **역할**: Cloudflare Worker 배포 설정
- **현재 상태**: `bucket_name = "your-r2-bucket-name"`, `SUPABASE_URL = "https://your-project-id.supabase.co"` 등 **모든 값이 예시/더미값**으로 채워져 있다. 즉, 한 번도 실제 배포에 사용된 적 없는 미완성 파일이다.

#### `package.json` + `node_modules/` (54,460바이트)
- **역할**: Worker 전용 의존성 (`@supabase/supabase-js`, `wrangler`)
- **문제점**: 이 패키지들은 Worker에서만 쓰이는 것이며, Worker 자체가 사용되지 않으므로 유지할 이유가 없다.

---

## 3. `recipe-git/src/utils/uploadToR2.ts` — 프론트엔드 R2 업로드 유틸리티 분석

### 3-1. 동작 방식
```typescript
// 경로 생성: recipes/{recipe_id}/{commit_id}/step_{step_number}_{timestamp}.jpg
const filePath = `recipes/${recipe_id}/${commit_id}/step_${step_number}_${timestamp}.${fileExtension}`;

// Cloudflare Worker에 PUT 요청
fetch(`${VITE_R2_WORKER_URL}/${filePath}`, { method: 'PUT', body: file });

// 업로드 후 공개 URL 반환
return `${VITE_R2_PUBLIC_DOMAIN}/${filePath}`;
```

### 3-2. 현재 상태
- `.env` 파일의 `VITE_R2_WORKER_URL`, `VITE_R2_PUBLIC_DOMAIN`이 **모두 플레이스홀더** (`your_r2_worker_url`, `your_r2_public_domain_url`)
- 코드 내부에도 `// TODO: 실제 프로젝트의 R2 Public Domain 또는 Worker URL로 교체` 주석이 남아있음
- `recipeSchema.ts`의 `StepSchema`에 `image_url` 필드가 **optional**로 정의되어 있어, 이 유틸리티가 없어도 앱이 정상 동작함
- **어떤 컴포넌트나 페이지에서도 이 함수를 `import`하거나 호출하지 않는다** (실제로 연결된 코드 없음)

---

## 4. `recipe-git/scripts/setup-db.sql` — 핵심 DB 스키마 분석

이 파일은 **삭제하면 안 되는** 핵심 설정 파일이다.

### 생성 테이블 목록

| 테이블명 | 역할 | 사용 현황 |
|---|---|---|
| `public.profiles` | 사용자 프로필 (auth.users 연동) | 앱에서 사용 |
| `public.recipes` | 레시피 메타데이터 및 포크 관계 | `useRecipeGit.ts`에서 사용 |
| `public.recipe_commits` | 레시피 버전 스냅샷 (JSONB) | `useRecipeGit.ts`에서 사용 |
| `public.recipe_branches` | 브랜치 최신 포인터 관리 | `useRecipeGit.ts`에서 사용 |

### 핵심 비즈니스 로직 (DB 레벨)
- **불변성 원칙**: `recipe_commits` 테이블의 RLS 정책으로 `UPDATE`, `DELETE` 쿼리를 불허 → Git 철학 구현
- **자동 프로필 생성 트리거**: `handle_new_user()` 함수로 회원가입 시 자동으로 `profiles` 테이블에 레코드 삽입

---

## 5. MCP 도입 시 무엇이 달라지는가?

### As-Is (MCP 이전)
```
개발자/AI가 Supabase DB를 조작하려면:
  → 코드에 supabase 클라이언트 작성
  → Worker 서버 구성 및 배포
  → 수동 SQL 실행
```

### To-Be (MCP 이후)
```
개발자/AI가 Supabase DB를 조작하려면:
  → MCP supabase 서버를 통해 직접 SQL 실행
  → MCP를 통해 테이블 생성, 조회, 수정, 삭제
  → 별도의 서버나 자동화 스크립트 불필요
```

### MCP가 대체하는 기능

| 기존 자동화 코드 | MCP 대체 방식 |
|---|---|
| `wrangler.toml` + Worker 배포 | MCP supabase 서버가 DB에 직접 접근 |
| `scripts/setup-supabase.sql` 수동 실행 | MCP로 SQL 직접 실행 |
| `scripts/setup-db.sql` 수동 실행 | MCP로 SQL 직접 실행 |
| Cloudflare Worker를 통한 R2→Supabase 동기화 | R2 MCP 또는 Supabase Storage로 직접 대체 가능 |

---

## 6. 삭제 권장 파일 및 폴더 목록

> [!IMPORTANT]
> 아래 목록은 **현재 상태 기준**에서 삭제해도 메인 앱(`recipe-git`)의 동작에 전혀 영향이 없는 항목들이다.

### 🗑️ 전체 삭제 권장: `r2-supabase-sync/` 폴더
**삭제 근거:**
1. **미완성 상태**: `wrangler.toml`의 모든 설정값이 플레이스홀더로 실제 배포 불가능한 상태
2. **앱과 단절**: `recipe-git`의 어떤 코드도 이 Worker를 의존하지 않음
3. **목적 소멸**: Workers의 유일한 목적은 "R2 업로드 시 Supabase 자동 기록"이었으나, MCP로 Supabase를 직접 제어하면 이 중간 레이어가 불필요
4. **불필요한 용량**: `node_modules/`까지 포함되어 있어 상당한 디스크 용량을 낭비 중

| 삭제 대상 | 이유 |
|---|---|
| `r2-supabase-sync/src/index.ts` | Worker 자체가 불필요 |
| `r2-supabase-sync/wrangler.toml` | 미완성, 배포 불가 상태 |
| `r2-supabase-sync/scripts/setup-supabase.sql` | `r2_files` 테이블은 앱에서 사용 안 함 |
| `r2-supabase-sync/package.json` | Worker 전용, Worker 삭제 시 불필요 |
| `r2-supabase-sync/node_modules/` | Worker 삭제 시 불필요 |

---

### 🗑️ 개별 삭제 권장: `recipe-git/src/utils/uploadToR2.ts`
**삭제 근거:**
1. **미구현 상태**: 함수가 정의되어 있으나 앱 내 어떤 컴포넌트/페이지에서도 `import`하여 사용하지 않음
2. **환경변수 미설정**: `.env`의 관련 변수가 모두 플레이스홀더 상태
3. **선택적 필드**: `StepSchema.image_url`이 `optional()`이므로 앱이 없어도 완전히 동작
4. **MCP 대체**: 향후 이미지 관련 기능 추가 시 Supabase Storage + MCP로 더 간결하게 구현 가능

---

### 🗑️ 환경변수 정리: `recipe-git/.env`
**현재 불필요한 항목:**
```diff
- VITE_R2_WORKER_URL=your_r2_worker_url
- VITE_R2_PUBLIC_DOMAIN=your_r2_public_domain_url
```
**유지해야 할 항목:**
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GEMINI_API_KEY=...
```

---

## 7. 유지해야 할 파일 목록

> [!NOTE]
> 아래 파일들은 메인 앱의 핵심 기능에 직접 연결되어 있으므로 절대 삭제하면 안 된다.

| 파일 | 역할 |
|---|---|
| `recipe-git/scripts/setup-db.sql` | 핵심 DB 스키마 (레시피 Git 시스템의 근간) |
| `recipe-git/src/lib/supabase.ts` | 앱-Supabase 연결 클라이언트 |
| `recipe-git/src/lib/gemini.ts` | Gemini AI 분석 클라이언트 |
| `recipe-git/src/hooks/useRecipeGit.ts` | Fork/Commit/Version Load 핵심 훅 |
| `recipe-git/src/hooks/useRecipeAI.ts` | AI 레시피 분석 훅 |
| `recipe-git/src/schemas/recipeSchema.ts` | Zod 런타임 검증 스키마 |
| `recipe-git/src/components/**` | UI 컴포넌트 (CommitTimeline, DiffViewer 등) |

---

## 8. 종합 결론

```
삭제 권장 요약:
  ✅ r2-supabase-sync/ (폴더 전체)
  ✅ recipe-git/src/utils/uploadToR2.ts
  ✅ recipe-git/.env → R2 관련 환경변수 2줄 제거

이유:
  1. 모든 대상이 미완성(플레이스홀더) 상태로, 실제로 한 번도 동작한 적 없음
  2. 앱 코드 어디서도 import/사용하지 않음 (완전히 분리된 데드 코드)
  3. MCP를 통해 Supabase를 AI가 직접 제어하므로 중간 자동화 레이어 불필요
  4. 삭제해도 recipe-git 메인 앱의 빌드 및 런타임에 전혀 영향 없음
```

> [!TIP]
> 향후 레시피 이미지 기능이 필요해지면, 복잡한 Cloudflare Worker 대신 **Supabase Storage**와 **MCP**를 조합하는 것이 훨씬 간결하고 유지보수가 쉬운 방향이다.

---
*이 보고서는 2026-03-05 기준으로 프로젝트 전체 소스 코드를 직접 분석하여 작성되었습니다.*
