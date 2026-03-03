-- Supabase SQL Editor에서 실행할 초기 설정 스크립트입니다.
-- 이 스크립트는 Cloudflare R2에 업로드된 파일들의 메타데이터를 저장할 테이블을 생성하고 보안 정책(RLS)을 설정합니다.

-- 1. 파일 정보를 저장할 테이블 생성
-- 파일 키(Key), URL, 크기, 타입 등을 저장하여 나중에 관리하거나 조회하기 용이하게 합니다.
CREATE TABLE IF NOT EXISTS public.r2_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_key TEXT NOT NULL UNIQUE,          -- R2 내의 파일 고유 키 (예: images/banner.png)
    file_url TEXT NOT NULL,                  -- 공개적으로 접근 가능한 URL 주소
    file_size BIGINT,                       -- 파일 크기 (바이트 단위)
    content_type TEXT,                      -- MIME 타입 (예: image/jpeg, application/pdf)
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb      -- 추가 정보(업로드 소스, 사용자 정보 등)를 유연하게 저장하기 위한 JSON 필드
);

-- 2. 행 단위 보안 정책(Row Level Security, RLS) 설정
-- 데이터를 안전하게 보호하기 위해 기본적으로 모든 접근을 차단한 후, 필요한 경우에만 허용합니다.
ALTER TABLE public.r2_files ENABLE ROW LEVEL SECURITY;

-- 2-1. 모든 사용자에게 읽기 권한 허용 (Public Read)
-- 이 정책이 활성화되면 누구나 저장된 파일 목록이나 정보를 조회할 수 있습니다.
CREATE POLICY "Allow public read access" ON public.r2_files
    FOR SELECT USING (true);

-- 2-2. 인증된 사용자 또는 서비스(Worker)에게만 삽입 권한 허용
-- 실제 서비스 운영 시에는 더 구체적인 인증 로직이 필요할 수 있으나, 현재는 모든 삽입 요청을 허용하도록 설정합니다.
-- (주의: 실제 상용 환경에서는 Worker의 전용 API 키 등을 통한 추가 인증이 권장됩니다.)
CREATE POLICY "Allow insert access" ON public.r2_files
    FOR INSERT WITH CHECK (true);

-- 인덱스 추가 (조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_r2_files_key ON public.r2_files(file_key);
