/**
 * Cloudflare Worker: R2 - Supabase 실시간 동기화 서비스
 *
 * 이 파일은 Cloudflare R2 버킷에 파일이 업로드될 때, 
 * 해당 파일의 메타데이터(URL, 크기, 타입 등)를 Supabase 데이터베이스에 자동으로 기록하는 역할을 합니다.
 * 
 * [주요 흐름]
 * 1. 클라이언트가 Worker로 PUT 요청을 보내 파일을 업로드합니다.
 * 2. Worker는 파일을 R2 버킷에 저장합니다.
 * 3. 저장 성공 후, Supabase 클라이언트를 사용하여 'r2_files' 테이블에 파일 정보를 삽입합니다.
 * 4. 클라이언트가 GET 요청을 보내면 R2 버킷에서 파일을 찾아 반환합니다.
 */

import { createClient } from '@supabase/supabase-js'

/**
 * 환경 변수 인터페이스 정의
 * Wrangler 설정 파일(wrangler.toml)에서 정의된 변수들이 이곳에 매핑됩니다.
 */
export interface Env {
  MY_R2_BUCKET: R2Bucket;     // Cloudflare R2 버킷 바인딩
  SUPABASE_URL: string;       // Supabase 프로젝트 URL
  SUPABASE_ANON_KEY: string;  // Supabase 익명 API 키
  R2_PUBLIC_DOMAIN: string;   // R2 파일에 접근 가능한 공개 도메인 주소
}

export default {
  /**
   * HTTP 요청을 처리하는 메인 핸들러
   * @param request 들어오는 HTTP 요청 객체
   * @param env 환경 변수 및 바인딩 객체
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const key = url.pathname.slice(1); // URL 경로에서 첫 번째 '/'를 제외한 나머지를 파일 키로 사용

    // [파일 업로드 처리: PUT]
    if (request.method === 'PUT') {
      try {
        // 요청 바디에서 파일 데이터를 읽어옵니다.
        const fileContent = await request.arrayBuffer();
        const contentType = request.headers.get('content-type') || 'application/octet-stream';

        // 1. Cloudflare R2 버킷에 파일 저장
        // put() 메서드를 사용하여 지정된 키로 데이터를 저장합니다.
        await env.MY_R2_BUCKET.put(key, fileContent, {
          httpMetadata: { contentType },
        });

        // 2. Supabase 클라이언트 초기화
        // Cloudflare Workers 환경에서는 글로벌 fetch를 명시적으로 전달해야 안정적으로 동작합니다.
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
          global: {
            fetch: (...args) => fetch(...args),
          },
        });

        // 3. Supabase 데이터베이스에 메타데이터 기록
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
              user_agent: request.headers.get('user-agent')
            }
          });

        // DB 기록 중 에러 발생 시 처리
        if (error) {
          console.error('Supabase 기록 실패:', error);
          return new Response(`R2 업로드 성공했으나 DB 기록 실패: ${error.message}`, { status: 500 });
        }

        return new Response(`파일 업로드 및 Supabase 동기화 완료! URL: ${fileUrl}`, { status: 200 });

      } catch (err: any) {
        return new Response(`처리 중 서버 오류 발생: ${err.message}`, { status: 500 });
      }
    }

    // [파일 조회 처리: GET]
    if (request.method === 'GET') {
      // 키가 비어있는 경우 (루트 접속 등) 예외 처리
      if (!key) {
        return new Response('조회할 파일 키를 지정해주세요.', { status: 400 });
      }

      // R2 버킷에서 파일 객체 가져오기
      const object = await env.MY_R2_BUCKET.get(key);

      if (object === null) {
        return new Response('파일을 찾을 수 없습니다.', { status: 404 });
      }

      // 응답 헤더 설정 (Content-Type 등 R2 메타데이터 반영)
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);

      // 파일 바디를 응답으로 반환
      return new Response(object.body, { headers });
    }

    // 지원하지 않는 메서드에 대한 처리
    return new Response('지원하지 않는 요청 방식입니다. (GET 또는 PUT만 가능)', { status: 405 });
  },
};
