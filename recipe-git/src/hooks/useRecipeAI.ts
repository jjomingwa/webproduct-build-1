/**
 * 레시피 깃허브: AI 레시피 분석 커스텀 훅 (useRecipeAI)
 * 
 * [설계 원칙]
 * 1. Gemini API와 통신하여 실시간 레시피 변환 조언 제공
 * 2. 복잡한 AI 응답 데이터를 정형화하여 UI로 전달
 */

import { useState } from 'react';
import { recipeAiModel, generateAnalysisPrompt } from '../lib/gemini';
import { RecipeData } from '../schemas/recipeSchema';

interface AIResult {
  suggested_changes: any;
  culinary_advice: string;
  commit_message: string;
}

export const useRecipeAI = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  const analyzeRecipe = async (recipe: RecipeData, intent: string) => {
    if (!intent) return;
    setIsAnalyzing(true);
    
    try {
      const prompt = generateAnalysisPrompt(JSON.stringify(recipe), intent);
      const result = await recipeAiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // JSON 파싱 시 안정성 확보 (Zod와 함께 사용 권장)
      const parsedResult = JSON.parse(text);
      setAiResult(parsedResult);
      return parsedResult;
    } catch (error: unknown) {
      console.error('AI 분석 중 오류 발생:', error);
      const message = error instanceof Error ? error.message : 'AI 분석에 실패했습니다.';
      alert(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { isAnalyzing, aiResult, analyzeRecipe, setAiResult };
};
