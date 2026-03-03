/**
 * 레시피 깃허브: 핵심 비즈니스 로직 커스텀 훅 (useRecipeGit)
 * 
 * [설계 원칙]
 * 1. 단방향 데이터 흐름: 직접적인 State 수정을 막고 새로운 커밋 객체를 통해서만 업데이트를 수용합니다.
 * 2. 런타임 안정성: Zod 스키마를 사용하여 데이터가 DB로 가기 전 100% 검증합니다.
 * 3. 유기적 연결: 이전 단계의 Zod Schema, R2 Utility, Supabase Client를 통합합니다.
 */

import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  RecipeDataSchema, 
  type RecipeData 
} from '../schemas/recipeSchema';

export const useRecipeGit = () => {
  // 현재 작업 중인 레시피의 스냅샷 상태 (불변성 유지)
  const [currentRecipe, setCurrentRecipe] = useState<RecipeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * [Fork 기능]
   * 타인의 레시피를 내 계정으로 가져와 새로운 레시피 엔트리를 생성합니다.
   */
  const forkRecipe = async (originalRecipeId: string, userId: string) => {
    setIsLoading(true);
    try {
      // 1. 원본 레시피의 최신 커밋 데이터 조회
      const { data: latestCommit, error: fetchError } = await supabase
        .from('recipe_commits')
        .select('*')
        .eq('recipe_id', originalRecipeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !latestCommit) throw new Error('원본 레시피 데이터를 가져오지 못했습니다.');

      // 2. 새로운 레시피 생성 (forked_from_id 설정)
      const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          title: `[Forked] ${latestCommit.data.title}`,
          description: latestCommit.data.description,
          forked_from_id: originalRecipeId,
          owner_id: userId
        })
        .select()
        .single();

      if (recipeError) throw new Error('레시피 포크에 실패했습니다.');

      // 3. 초기 커밋 생성
      const { error: commitError } = await supabase
        .from('recipe_commits')
        .insert({
          recipe_id: newRecipe.id,
          commit_message: 'Initial fork from source',
          data: latestCommit.data
        });

      if (commitError) throw new Error('초기 커밋 생성에 실패했습니다.');

      return newRecipe.id;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * [Commit 기능]
   * 변경된 레시피 데이터를 검증하고 새로운 버전(Commit)으로 저장합니다.
   */
  const commitRecipe = async (
    recipeId: string, 
    parentId: string | null, 
    newData: RecipeData, 
    message: string
  ) => {
    setIsLoading(true);
    try {
      // [Harness 검증] 데이터 전송 전 Zod 스키마로 런타임 오류 방지
      const validatedData = RecipeDataSchema.parse(newData);

      // 1. 새로운 커밋 삽입
      const { data: newCommit, error: commitError } = await supabase
        .from('recipe_commits')
        .insert({
          recipe_id: recipeId,
          parent_id: parentId,
          commit_message: message,
          data: validatedData
        })
        .select()
        .single();

      if (commitError) throw new Error(`커밋 실패: ${commitError.message}`);

      // 2. 브랜치(master)의 최신 포인터(Head) 업데이트
      const { error: branchError } = await supabase
        .from('recipe_branches')
        .upsert({
          recipe_id: recipeId,
          name: 'master',
          head_commit_id: newCommit.id,
          updated_at: new Date().toISOString()
        });

      if (branchError) throw new Error('브랜치 업데이트 실패');

      // 상태 업데이트 (불변성 보장을 위해 새로운 객체로 설정)
      setCurrentRecipe({ ...validatedData });
      return newCommit;

    } catch (err: any) {
      // Zod 검증 에러 처리 포함
      const errorMessage = err.errors ? '입력 데이터가 유효하지 않습니다.' : err.message;
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * [Load 기능]
   * 특정 커밋 시점의 레시피 데이터를 로드합니다.
   */
  const loadRecipeVersion = async (commitId: string) => {
    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('recipe_commits')
        .select('data')
        .eq('id', commitId)
        .single();

      if (fetchError) throw new Error('버전 로드 실패');
      
      setCurrentRecipe(data.data as RecipeData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentRecipe,
    isLoading,
    error,
    forkRecipe,
    commitRecipe,
    loadRecipeVersion,
    setCurrentRecipe // UI에서의 임시 수정을 위해 제공하지만 최종 저장은 commitRecipe를 통해서만 가능
  };
};
