# [System Integrity Plan] 레시피 깃허브 무결성 검증 및 구동 플랜

본 문서는 프로젝트의 모든 구성 요소가 연결성(Links), 변수(Variables), 실행(npm run dev), 호환성(Compatibility) 측면에서 완벽하게 작동하도록 보장하는 최종 점검 계획입니다.

---

## 1. 아키텍처 정합성 검토 (Architecture Integrity)

### A. 파일 구조 및 임포트 링크 검증
- **상태:** 현재 모든 파일은 `src/` 폴더 내에 논리적으로 분리되어 있습니다.
- **점검 포인트:** 
  - [x] **확장자 제거:** `main.tsx` 등에서 `.tsx` 확장자를 명시하지 않는 Vite 표준 준수 확인.
  - [x] **경로 정확성:** 상대 경로를 사용하여 설정 파일(`tsconfig.json`)과의 호환성 극대화.
  - [x] **대소문자 구분:** 파일명과 임포트 구문의 대소문자 일치 확인.

### B. 데이터 모델 및 형식 호환성
- **상태:** Zod 스키마(`recipeSchema.ts`)가 프론트엔드와 백엔드 사이의 게이트키퍼 역할을 수행합니다.
- **점검 포인트:**
  - [x] **JSONB 구조:** `RecipeDataSchema`가 Supabase JSONB 구조와 1:1 매칭 확인.
  - [x] **UUID 강제:** 모든 ID가 UUID 형식을 따르는지 확인.

---

## 2. 변수 및 환경 설정 검증 (Variables & Env)

### A. 환경 변수 동기화 (`.env` -> `vite-env.d.ts`)
- **상태:** `.env` 파일과 `vite-env.d.ts` 타입 정의 완료.
- **점검 포인트:**
  - [x] **접두어 준수:** 모든 환경 변수가 `VITE_` 접두어를 사용하여 클라이언트 사이드 접근 가능 확인.
  - [x] **Fallback 전략:** 변수 누락 시 `supabase.ts` 등에서 `throw Error` 발생 확인.

---

## 3. 실행 및 빌드 파이프라인 (Runtime & Build)

### A. `npm run dev` 무결성
- **상태:** Vite 설정 완료.
- **점검 포인트:**
  - [x] **의존성 무결성:** `npm install` 후 `package-lock.json`의 일관성 확인.

### B. Harness 검증 (`npm run validate`)
- **상태:** `tsc --noEmit && npm run lint` 스크립트가 0개 에러 달성.

---

## 4. 세부 로직 및 유기적 연결 (Logic Interaction)

| 기능 | 발신원 (Source) | 수신처 (Target) | 검증 기준 |
| :--- | :--- | :--- | :--- |
| **이미지 업로드** | `RecipeEditorPage` | `uploadToR2.ts` | R2 공개 도메인 URL 반환 확인 |
| **레시피 커밋** | `useRecipeGit` | `supabase.recipe_commits` | Zod 검증 후 JSONB 저장 확인 |
| **AI 분석** | `RecipeEditorPage` | `useRecipeAI` | Gemini 응답의 안정적 파싱 확인 |

---

## 5. 단계별 실행 가이드

1. **Supabase:** `scripts/setup-db.sql` 실행.
2. **Environment:** `.env` 실제 키 입력.
3. **Run:** `npm run dev` 실행.
