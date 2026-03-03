/**
 * 레시피 깃허브: 레시피 데이터 검증 스키마 (Zod)
 * 
 * [설계 목적]
 * 1. Supabase JSONB 데이터의 런타임 안정성 확보
 * 2. 타입 추론(Type Inference)을 통한 개발 생산성 향상
 * 3. 폼(Form) 입력 시 잘못된 데이터가 유입되는 것을 원천 차단
 */

import { z } from 'zod';

/**
 * [재료 정보 스키마]
 * 이름, 분량, 단위가 필수입니다.
 */
export const IngredientSchema = z.object({
  name: z.string().min(1, '재료명을 입력해주세요.'),
  amount: z.string().min(1, '분량을 입력해주세요.'),
  unit: z.string().min(1, '단위를 입력해주세요.'), // 예: g, ml, 큰술 등
});

/**
 * [조리 단계 정보 스키마]
 * 단계 순서, 설명, 그리고 R2에 저장될 이미지 URL을 포함합니다.
 */
export const StepSchema = z.object({
  order: z.number().int().positive('순서는 1 이상의 정수여야 합니다.'),
  desc: z.string().min(1, '조리 설명을 입력해주세요.'),
  image_url: z.string().url('유효한 이미지 URL 형식이 아닙니다.').optional(),
});

/**
 * [레시피 전체 데이터 스키마 (JSONB 구조)]
 * 레시피의 제목, 설명, 재료 리스트, 단계별 가이드를 포함하는 최종 데이터 구조입니다.
 */
export const RecipeDataSchema = z.object({
  title: z.string().min(1, '레시피 제목을 입력해주세요.'),
  description: z.string().optional(),
  ingredients: z.array(IngredientSchema).min(1, '최소 1개 이상의 재료가 필요합니다.'),
  steps: z.array(StepSchema).min(1, '최소 1개 이상의 조리 단계가 필요합니다.'),
});

// TypeScript에서 사용할 타입 정의 추출
export type Ingredient = z.infer<typeof IngredientSchema>;
export type Step = z.infer<typeof StepSchema>;
export type RecipeData = z.infer<typeof RecipeDataSchema>;

/**
 * [커밋 정보 스키마]
 * 버전 관리를 위한 커밋 메타데이터 및 스냅샷 정보를 포함합니다.
 */
export const RecipeCommitSchema = z.object({
  id: z.string().uuid(),         // 커밋 고유 해시 (UUID)
  parent_id: z.string().uuid().nullable(), // 이전 커밋 ID (null이면 첫 커밋)
  recipe_id: z.string().uuid(),  // 소속 레시피 ID
  commit_message: z.string().min(1, '커밋 메시지를 입력해주세요.'),
  created_at: z.string().datetime(), // ISO 8601 형식
  data: RecipeDataSchema,         // 해당 시점의 레시피 데이터 스냅샷
});

export type RecipeCommit = z.infer<typeof RecipeCommitSchema>;
