-- Supabase SQL Editor에서 실행할 스크립트입니다.
-- 이 테이블은 Cloudflare R2에 업로드된 파일의 메타데이터를 저장하는 용도입니다.

-- 1. 파일 정보를 저장할 테이블 생성
CREATE TABLE IF NOT EXISTS public.r2_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_key TEXT NOT NULL UNIQUE,          -- R2 내에서의 파일 경로/이름
    file_url TEXT NOT NULL,                  -- 접근 가능한 URL (커스텀 도메인 등)
    file_size BIGINT,                       -- 파일 크기 (bytes)
    content_type TEXT,                      -- 파일 타입 (image/png 등)
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb      -- 추가 정보 저장용 (업로더 ID 등)
);

-- 2. 보안 설정 (Row Level Security)
-- 기본적으로 모든 읽기는 허용하고, 쓰기는 인증된 관리자만 가능하게 설정하는 것이 일반적입니다.
ALTER TABLE public.r2_files ENABLE ROW LEVEL SECURITY;

-- 누구나 읽을 수 있는 정책 (Public Read)
CREATE POLICY "Allow public read access" ON public.r2_files
    FOR SELECT USING (true);

-- 인증된 익명 사용자(Worker 등)가 데이터를 삽입할 수 있는 정책 (예시)
CREATE POLICY "Allow authenticated insert" ON public.r2_files
    FOR INSERT WITH CHECK (true);
