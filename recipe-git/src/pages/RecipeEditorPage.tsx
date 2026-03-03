/**
 * 레시피 깃허브: 레시피 에디터 통합 페이지
 * 
 * [설계 목적]
 * 1. useRecipeGit 훅을 통한 상태 관리 및 비즈니스 로직 연결
 * 2. Diff Viewer, Commit Timeline 컴포넌트 통합
 * 3. Fork, Commit 기능 사용자 인터페이스 제공
 */

import React, { useState } from 'react';
import { useRecipeGit } from '../hooks/useRecipeGit';
import { useRecipeAI } from '../hooks/useRecipeAI'; // AI 훅 추가
import RecipeDiffViewer from '../components/RecipeDiffViewer';
import CommitTimeline from '../components/CommitTimeline';
import AIAdviceModal from '../components/AIAdviceModal'; // AI 모달 추가
import { RecipeData } from '../schemas/recipeSchema';

const INITIAL_RECIPE_DATA: RecipeData = {
  title: 'Classic Kimchi Jjigae',
  description: 'A traditional Korean staple.',
  ingredients: [
    { name: 'Kimchi', amount: '200', unit: 'g' },
    { name: 'Pork Belly', amount: '100', unit: 'g' },
    { name: 'Tofu', amount: '1', unit: 'piece' },
  ],
  steps: [{ order: 1, desc: 'Fry kimchi and pork together.' }]
};

const RecipeEditorPage: React.FC = () => {
  const { 
    currentRecipe, 
    isLoading: isGitLoading, 
    error, 
    forkRecipe, 
    commitRecipe, 
    loadRecipeVersion
  } = useRecipeGit();

  const [localRecipe] = useState<RecipeData>(INITIAL_RECIPE_DATA);
  const activeRecipe = currentRecipe || localRecipe;

  const { isAnalyzing, aiResult, analyzeRecipe } = useRecipeAI(); // AI 훅 사용
  
  const [originalRecipe] = useState<RecipeData | null>(INITIAL_RECIPE_DATA);
  const [commitMessage, setCommitMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 타임라인용 모의 데이터
  const mockCommits = [
    { id: 'commit-1', message: 'Initial Recipe', author: 'chef_master', date: '2026-03-01T12:00:00Z' },
    { id: 'commit-2', message: 'Add Sugar for better taste', author: 'sugar_lover', date: '2026-03-02T15:30:00Z' },
  ];

  const handleAIAnalyze = async () => {
    if (!activeRecipe) return;
    const intent = prompt("어떻게 레시피를 바꾸고 싶으신가요? (예: 비건용으로 바꾸기, 저당 버전으로 만들기)");
    if (intent) {
      await analyzeRecipe(activeRecipe, intent);
      setIsModalOpen(true);
    }
  };

  const handleCommit = async () => {
    if (!activeRecipe || !commitMessage) return;
    const result = await commitRecipe('recipe-123', 'commit-2', activeRecipe, commitMessage);
    if (result) {
      alert('Commit successful!');
      setCommitMessage('');
    }
  };

  if (!activeRecipe) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <header className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Recipe Git</h1>
          <p className="text-gray-500">Track and fork your favorite recipes with AI Power.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleAIAnalyze}
            disabled={isAnalyzing}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            {isAnalyzing ? 'AI Analyzing...' : 'Analyze with AI'}
          </button>
          <button 
            onClick={() => forkRecipe('recipe-123', 'user-456')}
            className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            {/* ... (기존 아이콘 동일) */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M18 6V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2"/><path d="m20 8-8 8-8-8"/></svg>
            Fork Recipe
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Recipe</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="text-gray-700 font-medium">Commit Message</span>
                <input 
                  type="text" 
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="What did you change? (e.g., Replaced sugar with Stevia)"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                />
              </label>
              <button 
                onClick={handleCommit}
                disabled={isGitLoading}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:bg-gray-400"
              >
                {isGitLoading ? 'Committing...' : 'Commit Changes'}
              </button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </section>

          <RecipeDiffViewer original={originalRecipe} modified={activeRecipe} />
        </div>

        <aside>
          <CommitTimeline 
            commits={mockCommits} 
            onCommitSelect={(id) => loadRecipeVersion(id)} 
            activeCommitId="commit-2"
          />
        </aside>
      </main>

      {/* AI 조언 모달 연결 */}
      {aiResult && (
        <AIAdviceModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          advice={aiResult.culinary_advice}
          suggestedCommit={aiResult.commit_message}
          onApplyCommit={(msg) => {
            setCommitMessage(msg);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default RecipeEditorPage;
