/**
 * 레시피 깃허브: Gemini AI 서비스 설정
 * 
 * [설계 목적]
 * 1. 구글 Gemini API를 통한 레시피 분석 및 조언 생성
 * 2. 프롬프트 엔지니어링을 통한 조리학적 전문성 확보
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// 요리 전문가 페르소나를 부여한 모델 설정
export const recipeAiModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    responseMimeType: "application/json", // JSON 응답 강제 (안정성 확보)
  }
});

/**
 * [AI 분석 프롬프트 템플릿]
 * 원본 레시피와 사용자의 수정 의도를 바탕으로 구조화된 조언을 요청합니다.
 */
export const generateAnalysisPrompt = (originalRecipe: string, intent: string) => `
당신은 세계 최고의 요리 과학자이자 전문 셰프입니다.
다음 원본 레시피를 사용자의 의도에 맞게 분석하여 수정 제안을 하세요.

[원본 레시피 JSON]
${originalRecipe}

[사용자의 수정 의도]
"${intent}"

[응답 형식]
반드시 아래 키를 가진 JSON 객체로 응답하세요:
1. "suggested_changes": { "ingredients": [], "steps": [] } - 변경이 필요한 구체적인 항목들
2. "culinary_advice": "재료 변경에 따른 조리법(온도, 시간 등)의 변화에 대한 전문적 조언"
3. "commit_message": "이 변경사항을 요약하는 짧은 Git 커밋 메시지 (예: '알룰로스 대체로 인한 당질 제한 버전 생성')"

주의: 조리 과학적으로 타당한 제안만 하세요.
`;
