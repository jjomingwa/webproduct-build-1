-- 1. [사용자 프로필 테이블]
-- auth.users와 연결되어 사용자 정보를 관리합니다.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. [레시피 테이블]
-- 레시피의 메타데이터와 포크(Fork) 관계를 관리합니다.
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    forked_from_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL, -- 원본 레시피 (포크 출처)
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- 소유자
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. [레시피 커밋 테이블]
-- 레시피의 변경 이력(Snapshot)을 JSONB 형태로 저장하며, 트리 구조를 형성합니다.
CREATE TABLE IF NOT EXISTS public.recipe_commits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES public.recipe_commits(id) ON DELETE SET NULL, -- 이전 커밋 (부모)
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    commit_message TEXT NOT NULL,
    data JSONB NOT NULL, -- 핵심: 재료 및 조리 단계 스냅샷 저장
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. [레시피 브랜치 테이블]
-- 특정 레시피의 작업 줄기(예: master, 알룰로스-버전)의 최신 커밋을 가리킵니다.
CREATE TABLE IF NOT EXISTS public.recipe_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 브랜치 이름 (예: 'master', 'low-sugar')
    head_commit_id UUID REFERENCES public.recipe_commits(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(recipe_id, name) -- 동일 레시피 내 브랜치 이름 중복 방지
);

-- [보안 설정: Row Level Security (RLS)]
-- PRD 6항 준수: 무단 수정 방지 및 데이터 보호

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_branches ENABLE ROW LEVEL SECURITY;

-- 1. Profiles 정책
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Recipes 정책
CREATE POLICY "Recipes are viewable by everyone" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Users can insert own recipes" ON public.recipes FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own recipes" ON public.recipes FOR UPDATE USING (auth.uid() = owner_id);

-- 3. Recipe Commits 정책 (불변성 원칙)
-- 커밋은 한 번 생성되면 수정하거나 삭제할 수 없습니다 (Git 철학 준수).
CREATE POLICY "Commits are viewable by everyone" ON public.recipe_commits FOR SELECT USING (true);
CREATE POLICY "Users can insert commits to own recipes" ON public.recipe_commits FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.recipes 
        WHERE id = recipe_id AND owner_id = auth.uid()
    )
);

-- 4. Recipe Branches 정책
CREATE POLICY "Branches are viewable by everyone" ON public.recipe_branches FOR SELECT USING (true);
CREATE POLICY "Users can manage branches of own recipes" ON public.recipe_branches 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.recipes 
        WHERE id = recipe_id AND owner_id = auth.uid()
    )
);

-- [자동 프로필 생성 트리거]
-- 사용자가 가입할 때 자동으로 profiles 테이블에 기본 정보를 생성합니다.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
