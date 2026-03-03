/**
 * 레시피 깃허브: Commit Timeline 컴포넌트
 * 
 * [설계 목적]
 * 1. 레시피의 변경 이력을 타임라인 형태로 시각화
 * 2. 특정 커밋 클릭 시 해당 시점의 데이터를 로드할 수 있는 인터페이스 제공
 */

import React from 'react';

interface Commit {
  id: string;
  message: string;
  author: string;
  date: string;
}

interface CommitTimelineProps {
  commits: Commit[];
  onCommitSelect: (commitId: string) => void;
  activeCommitId?: string;
}

const CommitTimeline: React.FC<CommitTimelineProps> = ({ commits, onCommitSelect, activeCommitId }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-h-[600px] overflow-y-auto">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
          <path d="M12 8V12L15 15" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        Commit History
      </h3>

      <div className="relative pl-6 border-l-2 border-gray-100 space-y-8">
        {commits.map((commit) => (
          <div 
            key={commit.id} 
            className={`relative group cursor-pointer transition-all ${activeCommitId === commit.id ? 'scale-105 z-10' : ''}`}
            onClick={() => onCommitSelect(commit.id)}
          >
            {/* 타임라인 노드 (점) */}
            <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white transition-colors
              ${activeCommitId === commit.id ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-gray-300 group-hover:bg-blue-400'}`}
            ></div>

            {/* 커밋 카드 */}
            <div className={`p-4 rounded-lg border transition-all 
              ${activeCommitId === commit.id ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:border-gray-200'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{commit.message}</h4>
                <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded font-mono text-gray-500">
                  {commit.id.slice(0, 7)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className="font-medium text-gray-700">@{commit.author}</span>
                <span>•</span>
                <span>{new Date(commit.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommitTimeline;
