/**
 * 레시피 깃허브: Supabase 클라이언트 설정
 * 
 * [설계 목적]
 * 1. 프로젝트 전역에서 사용할 Supabase 인스턴스 단일화
 * 2. 환경 변수를 통한 보안성 확보
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL 또는 Anon Key가 설정되지 않았습니다. .env 파일을 확인해주세요.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
