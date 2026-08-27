# 🎮 BLOCKVERSE — 3D 블록 어드벤처

Roblox 스타일의 3D 레고 캐릭터 멀티플레이어 게임.  
React + Three.js + Socket.io 기반 PWA 앱.

---

## 📁 프로젝트 구조

```
blockverse/
├── src/                  ← React 프론트엔드 (GitHub Pages 배포)
│   ├── components/
│   │   ├── Character.tsx      3D 레고 캐릭터
│   │   ├── CustomizeScreen.tsx 커스터마이징 화면
│   │   ├── GameScreen.tsx     메인 게임 화면
│   │   ├── LobbyScreen.tsx    로비/초대
│   │   ├── MobileControls.tsx 모바일 조이스틱
│   │   ├── City.tsx           빌딩/나무/코인 맵
│   │   └── PWAInstallBanner.tsx 앱 설치 배너
│   └── store/useGameStore.ts  전역 상태 (Zustand)
├── server/               ← Node.js 서버 (Render.com 배포)
│   ├── index.js               Socket.io 멀티플레이어 서버
│   ├── package.json
│   ├── .env.example
│   └── render.yaml
├── public/
│   ├── manifest.json          PWA 매니페스트
│   ├── sw.js                  서비스 워커
│   ├── icon-192.png
│   └── icon-512.png
└── .github/workflows/
    └── deploy.yml             GitHub Actions 자동 배포
```

---

## 🚀 Step 1 — GitHub에 올리기

### 1-1. Git 초기화 & Push

```bash
# 터미널에서 프로젝트 폴더로 이동
cd blockverse

# Git 초기화
git init
git add .
git commit -m "🎮 Initial commit: BLOCKVERSE PWA"

# GitHub에서 새 레포 생성 후
git remote add origin https://github.com/[YOUR-USERNAME]/blockverse.git
git branch -M main
git push -u origin main
```

### 1-2. GitHub Pages 활성화

1. GitHub 레포 → **Settings** 탭
2. 왼쪽 메뉴 → **Pages**
3. Source: **GitHub Actions** 선택
4. 저장 후 → Actions 탭에서 배포 진행 확인
5. 약 1~2분 후 `https://[YOUR-USERNAME].github.io/blockverse` 접속 가능

---

## 📱 Step 2 — 핸드폰에 PWA 설치

### Android (Chrome)
1. 위 URL을 Chrome에서 열기
2. 주소창 오른쪽 **⋮** → **"앱 설치"** 또는
3. 화면 하단에 자동으로 뜨는 **"홈 화면에 추가"** 배너 탭
4. → 네이티브 앱처럼 설치 완료 ✅

### iPhone/iPad (Safari)
1. **Safari**로 위 URL 열기 (Chrome은 PWA 설치 불가)
2. 하단 가운데 **□↑ 공유 버튼** 탭
3. **"홈 화면에 추가"** 탭
4. 이름 확인 후 **"추가"** 탭
5. → 홈 화면에 아이콘 생성 ✅

> 💡 앱을 열면 전체화면으로 실행됩니다!

---

## 🖥️ Step 3 — 무료 서버 배포 (Render.com)

실시간 멀티플레이어를 위해 Socket.io 서버가 필요합니다.  
**Render.com** 무료 플랜을 사용합니다.

### Render.com이 최고인 이유
| 서비스 | 무료 플랜 | 슬립 여부 | 배포 방식 |
|--------|-----------|-----------|-----------|
| **Render.com** ⭐ | 750시간/월 | 15분 비활성시 슬립 | GitHub 연동 |
| Railway.app | 500시간/월 | 없음 | GitHub 연동 |
| Fly.io | 3개 VM 무료 | 없음 | CLI 배포 |
| Cyclic.sh | 무제한 | 없음 | GitHub 연동 |

---

### 3-1. Render.com 서버 배포 방법

#### ① Render 가입
1. https://render.com 접속
2. **Sign up with GitHub** 클릭 (GitHub 계정으로 가입)

#### ② 새 Web Service 생성
1. Dashboard → **New +** → **Web Service**
2. **"Build and deploy from a Git repository"** 선택
3. GitHub 레포 연결 (`blockverse` 레포 선택)
4. 다음과 같이 설정:

```
Name:          blockverse-server
Region:        Singapore (한국과 가장 가까움)
Branch:        main
Root Directory: server          ← 중요! server 폴더 지정
Build Command: npm install
Start Command: node index.js
Instance Type: Free
```

#### ③ 환경변수 설정
"Environment" 섹션에 추가:

```
NODE_ENV      = production
CLIENT_ORIGIN = https://[YOUR-USERNAME].github.io
```

#### ④ 배포 시작
- **"Create Web Service"** 클릭
- 약 2~3분 후 배포 완료
- 서버 URL 확인: `https://blockverse-server-xxxx.onrender.com`

#### ⑤ 서버 URL을 프론트엔드에 연결
`src/store/useGameStore.ts` 또는 `src/components/GameScreen.tsx` 상단에 추가:

```typescript
// 실제 Render.com 서버 URL로 교체
const SERVER_URL = 'https://blockverse-server-xxxx.onrender.com';
```

---

### 3-2. Railway.app 대안 (더 안정적, 크레딧 방식)

1. https://railway.app → **GitHub로 로그인**
2. **New Project** → **Deploy from GitHub repo**
3. `blockverse` 레포 선택
4. **Root Directory**: `server` 설정
5. 환경변수:
   ```
   NODE_ENV = production
   CLIENT_ORIGIN = https://[YOUR-USERNAME].github.io
   ```
6. 배포 완료 → 자동 URL 생성

---

### 3-3. Render 무료 플랜 슬립 해결법

무료 플랜은 **15분 비활성 시 슬립** 상태가 됩니다.  
첫 접속 시 30초 정도 걸릴 수 있습니다.

**해결법 1: UptimeRobot (무료 모니터링)**
1. https://uptimerobot.com 가입 (무료)
2. **New Monitor** → HTTP(s) 타입
3. URL: `https://your-server.onrender.com`
4. 모니터링 간격: **5분** (5분마다 핑 → 슬립 방지)

**해결법 2: cron-job.org**
1. https://cron-job.org 가입
2. 매 5분마다 서버 URL 호출 설정

---

## 🔧 Step 4 — 로컬 개발 환경

```bash
# 프론트엔드 개발 서버
npm run dev
# → http://localhost:5173

# 서버 개발
cd server
npm install
node index.js
# → http://localhost:3001
```

---

## 🎮 게임 조작법

| 조작 | PC | 모바일 |
|------|-----|--------|
| 이동 | WASD / 방향키 | 왼쪽 조이스틱 |
| 점프 | Space | JUMP 버튼 |
| 카메라 회전 | 마우스 드래그 | 화면 드래그 |
| 카메라 좌/우 | Q / E | ◀ ▶ 버튼 |
| 메뉴 | 좌상단 ☰ | 좌상단 ☰ |

---

## 🌐 전체 아키텍처

```
[iPhone/Android]          [PC Chrome]
       ↓                       ↓
   PWA App              PWA App (or Web)
       ↓                       ↓
  GitHub Pages ──────────────────
  (React + Three.js)
       ↓ Socket.io WebSocket
  Render.com Server
  (Express + Socket.io)
  ├── 위치 동기화 (20fps)
  ├── 코인 수집 동기화
  ├── 채팅
  └── 방 코드 관리
```

---

## 📦 사용 기술 스택

### 프론트엔드
- **React 19** + TypeScript
- **Three.js** + @react-three/fiber + @react-three/drei
- **Zustand** (전역 상태)
- **Tailwind CSS 4**
- **PWA** (Service Worker + Web App Manifest)

### 서버
- **Node.js 20** + Express
- **Socket.io 4** (WebSocket 실시간 통신)

### 배포
- **GitHub Pages** (프론트엔드 무료 호스팅)
- **Render.com** (서버 무료 호스팅)
- **GitHub Actions** (CI/CD 자동 배포)

---

## ❓ 자주 묻는 질문

**Q. 아이폰에서 앱이 설치가 안 돼요.**  
A. 반드시 **Safari 브라우저**를 사용해야 합니다. Chrome iOS는 PWA 설치를 지원하지 않습니다.

**Q. 서버가 느려요 (첫 접속 30초).**  
A. Render 무료 플랜의 슬립 현상입니다. UptimeRobot으로 해결하세요 (Step 3-3).

**Q. 친구와 실시간 멀티플레이가 안 돼요.**  
A. 서버 URL을 GameScreen.tsx에 연결했는지 확인하세요.

**Q. GitHub Pages에서 새로고침하면 404 에러가 나요.**  
A. deploy.yml이 자동으로 `404.html`을 생성해 처리합니다.
