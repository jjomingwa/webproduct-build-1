/**
 * 레시피 깃허브: Diff Viewer 컴포넌트
 * 
 * [설계 목적]
 * 1. 원본과 현재 버전의 레시피 데이터를 비교하여 변경사항 시각화
 * 2. 삭제된 재료(빨간색 취소선)와 추가된 재료(초록색 하이라이트) 구분
 */

import React from 'react';
import { RecipeData } from '../schemas/recipeSchema';

interface DiffViewerProps {
  original: RecipeData | null;
  modified: RecipeData;
}

const RecipeDiffViewer: React.FC<DiffViewerProps> = ({ original, modified }) => {
  // 간단한 Diff 알고리즘: 이름 기준 비교
  const originalIngs = original?.ingredients || [];
  const modifiedIngs = modified.ingredients;

  const deletedIngs = originalIngs.filter(o => !modifiedIngs.some(m => m.name === o.name));
  const addedIngs = modifiedIngs.filter(m => !originalIngs.some(o => o.name === m.name));
  const stayedIngs = modifiedIngs.filter(m => originalIngs.some(o => o.name === m.name));

  return (
    <div className="bg-white text-gray-800 p-6 rounded-xl shadow-lg border border-gray-100">
      <h3 className="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2">
        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-sm font-mono">diff --git</span>
        Changes in Ingredients
      </h3>
      
      <ul className="space-y-2 font-mono text-sm">
        {/* 삭제된 재료 (Red) */}
        {deletedIngs.map((ing, idx) => (
          <li key={`del-${idx}`} className="bg-red-50 text-red-600 px-2 py-1 rounded flex items-center">
            <span className="mr-2 font-bold">-</span>
            <del className="opacity-70">{ing.name} ({ing.amount}{ing.unit})</del>
          </li>
        ))}

        {/* 추가된 재료 (Green) */}
        {addedIngs.map((ing, idx) => (
          <li key={`add-${idx}`} className="bg-green-50 text-green-600 px-2 py-1 rounded flex items-center">
            <span className="mr-2 font-bold">+</span>
            <strong>{ing.name} ({ing.amount}{ing.unit})</strong>
          </li>
        ))}

        {/* 유지된 재료 */}
        {stayedIngs.map((ing, idx) => (
          <li key={`stay-${idx}`} className="px-2 py-1 flex items-center text-gray-400">
            <span className="mr-2"> </span>
            {ing.name} ({ing.amount}{ing.unit})
          </li>
        ))}
      </ul>

      {/* 조리 단계 변경 간략화 */}
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 border-b pb-2">Step History</h3>
        <p className="text-sm text-gray-500 italic">
          (Note: 조리 단계의 미세한 변경사항은 다음 버전에서 지원 예정입니다.)
        </p>
      </div>
    </div>
  );
};

export default RecipeDiffViewer;
