/**
 * Cloudflare Worker: R2 - Supabase 연결 자동화 로직
 * 
 * [목적]
 * 1. 클라이언트가 파일을 전송하면 R2에 저장합니다.
 * 2. 저장 성공 시, Supabase 데이터베이스에 파일 메타데이터를 기록합니다.
 * 3. 별도의 관리 없이도 파일 관리 이력을 통합할 수 있습니다.
 */

import { createClient } from '@supabase/supabase-js'

// Cloudflare Worker가 사용하는 환경 변수 인터페이스
export interface Env {
  MY_R2_BUCKET: R2Bucket; // Wrangler 설정에서 바인딩할 R2 버킷
  SUPABASE_URL: string;   // Supabase 프로젝트 URL
  SUPABASE_ANON_KEY: string; // Supabase 익명 키 (Anon Key)
  R2_PUBLIC_DOMAIN: string;  // R2 버킷에 접근 가능한 퍼블릭 도메인 URL (있을 경우)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // URL 경로(/path/to/file.png)를 R2 키로 사용

    // [1단계] 파일 업로드 요청 처리 (PUT 방식 기준)
    if (request.method === 'PUT') {
      try {
        const fileContent = await request.arrayBuffer();
        const contentType = request.headers.get('content-type') || 'application/octet-stream';

        // 1. R2 버킷에 파일 업로드
        await env.MY_R2_BUCKET.put(key, fileContent, {
          httpMetadata: { contentType },
        });

        // [2단계] Supabase 클라이언트 초기화 (Custom Fetch 사용)
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
          global: {
            fetch: (...args) => fetch(...args), // Workers 환경 호환성을 위해 global fetch 사용
          },
        });

        // 2. Supabase DB에 메타데이터 저장
        const fileUrl = `${env.R2_PUBLIC_DOMAIN}/${key}`;
        const { error } = await supabase
          .from('r2_files')
          .insert({
            file_key: key,
            file_url: fileUrl,
            file_size: fileContent.byteLength,
            content_type: contentType,
            metadata: { 
              source: 'cloudflare-worker-auto-sync',
              ua: request.headers.get('user-agent') 
            }
          });

        if (error) {
          console.error('Supabase 기록 실패:', error);
          return new Response(`R2 업로드 성공했으나 Supabase 기록 실패: ${error.message}`, { status: 500 });
        }

        return new Response(`파일 업로드 및 Supabase 동기화 성공! URL: ${fileUrl}`, { status: 200 });

      } catch (err: any) {
        return new Response(`업로드 도중 오류 발생: ${err.message}`, { status: 500 });
      }
    }

    // [3단계] 파일 조회 요청 처리 (GET 방식)
    if (request.method === 'GET') {
      const object = await env.MY_R2_BUCKET.get(key);

      if (object === null) {
        return new Response('파일을 찾을 수 없습니다.', { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);

      return new Response(object.body, { headers });
    }

    return new Response('지원하지 않는 메서드입니다. (GET/PUT만 지원)', { status: 400 });
  },
};
