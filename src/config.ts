/**
 * 🌐 BLOCKVERSE 서버 설정
 *
 * ▶ 여기에 Render.com에서 획득한 서버 주소를 입력하세요.
 * ▶ 서버가 없으면 '' (빈 문자열)로 두면 오프라인(솔로) 모드로 작동합니다.
 *
 * 예시:
 *   export const SERVER_URL = 'https://blockverse-ws5p.onrender.com';
 */

export const SERVER_URL = 'https://blockverse-ws5p.onrender.com';

/** 온라인 모드 여부 (자동 판별) */
export const IS_ONLINE = SERVER_URL.length > 0;
