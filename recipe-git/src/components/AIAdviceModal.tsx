/**
 * 레시피 깃허브: AI 조언 모달 컴포넌트 (AIAdviceModal)
 * 
 * [설계 목적]
 * 1. Gemini AI의 분석 결과 시각화
 * 2. 추천 커밋 메시지를 즉시 적용할 수 있는 기능 제공
 * 3. 조리 과학적 지식을 깔끔한 UI로 전달
 */

import React from 'react';

interface AIAdviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  advice: string;
  suggestedCommit: string;
  onApplyCommit: (msg: string) => void;
}

const AIAdviceModal: React.FC<AIAdviceModalProps> = ({ 
  isOpen, 
  onClose, 
  advice, 
  suggestedCommit, 
  onApplyCommit 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* 모달 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          <h3 className="text-xl font-bold text-white">AI Recipe Expert Advise</h3>
        </div>

        {/* 모달 바디 */}
        <div className="p-8 space-y-6">
          <section>
            <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Professional Advice</h4>
            <p className="text-gray-700 leading-relaxed text-lg italic">
              "{advice}"
            </p>
          </section>

          <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Recommended Commit Message</h4>
            <div className="flex items-center justify-between gap-4">
              <code className="text-sm font-mono text-gray-800 break-all">{suggestedCommit}</code>
              <button 
                onClick={() => onApplyCommit(suggestedCommit)}
                className="shrink-0 text-blue-600 font-bold hover:underline"
              >
                Apply
              </button>
            </div>
          </section>
        </div>

        {/* 모달 푸터 */}
        <div className="px-8 py-6 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAdviceModal;
