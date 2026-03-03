/**
 * 레시피 깃허브: Cloudflare R2 이미지 업로드 유틸리티
 * 
 * [설계 목적]
 * 1. PRD의 경로 규칙 준수: recipes/{recipe_id}/{commit_id}/step_{step_number}_{timestamp}.jpg
 * 2. 일관된 이미지 관리 및 버전별 이미지 불변성 유지
 * 3. 업로드 성공 시 공개 URL 반환
 */

interface UploadParams {
  recipe_id: string;
  commit_id: string;
  step_number: number;
  file: File;
}

/**
 * Cloudflare R2로 이미지를 업로드하는 함수
 * @note 실제 구현 시에는 보안을 위해 Worker를 통하거나 사전 서명된 URL(Presigned URL)을 사용해야 합니다.
 * 여기서는 프로젝트의 아키텍처에 맞춘 경로 생성 로직과 요청 구조를 설계합니다.
 */
export const uploadToR2 = async ({
  recipe_id,
  commit_id,
  step_number,
  file,
}: UploadParams): Promise<string> => {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop() || 'jpg';
  
  // PRD 정의 경로 생성
  const filePath = `recipes/${recipe_id}/${commit_id}/step_${step_number}_${timestamp}.${fileExtension}`;

  // TODO: 실제 프로젝트의 R2 Public Domain 또는 Worker URL로 교체
  const R2_WORKER_URL = import.meta.env.VITE_R2_WORKER_URL;

  try {
    const response = await fetch(`${R2_WORKER_URL}/${filePath}`, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`R2 업로드 실패: ${response.statusText}`);
    }

    // 업로드된 이미지의 공개 URL 반환
    const R2_PUBLIC_DOMAIN = import.meta.env.VITE_R2_PUBLIC_DOMAIN;
    return `${R2_PUBLIC_DOMAIN}/${filePath}`;
  } catch (error) {
    console.error('R2 이미지 업로드 중 오류 발생:', error);
    throw error;
  }
};
