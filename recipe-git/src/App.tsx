/**
 * 레시피 깃허브: 메인 어플리케이션 컴포넌트
 * 
 * [설계 목적]
 * 1. 전체 어플리케이션의 루트 레이아웃 정의
 * 2. 레시피 에디터 페이지를 메인으로 렌더링
 */

import React from 'react';
import RecipeEditorPage from './pages/RecipeEditorPage';
import './index.css';

const App: React.FC = () => {
  return (
    <div className="app-container">
      {/* 
        추후 React Router를 도입하여 메인 대시보드, 
        레시피 탐색, 프로필 페이지 등으로 확장할 수 있는 구조입니다.
      */}
      <RecipeEditorPage />
    </div>
  );
};

export default App;
