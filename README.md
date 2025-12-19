# 건쉽 연합 관리 시스템

건쉽배틀토탈워페어 연합 관리를 위한 웹 애플리케이션입니다.

## 주요 기능

- **회원 관리**: 연합원 정보 조회 및 전투력 관리
- **세계대전 관리**: 참가 여부 등록 및 이력 추적
- **조편성**: 세계대전 조 구성 및 역할 배정
- **개인 설정**: 본인 프로필 정보 수정

## 기술 스택

- React 19 + Vite
- Tailwind CSS
- Firebase (Authentication + Firestore)
- React Router

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 프로젝트 설정

1. [Firebase 콘솔](https://console.firebase.google.com)에서 새 프로젝트 생성
2. Authentication 활성화 (Google 로그인 제공업체 추가)
3. Firestore Database 생성 (프로덕션 모드)
4. 프로젝트 설정 > 일반 > 웹 앱 추가
5. Firebase SDK 설정값 복사

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Firestore 보안 규칙 설정

Firebase 콘솔 > Firestore Database > 규칙에서 아래 규칙 적용:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 로그인한 사용자만 읽기 가능
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /worldWars/{warId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /participations/{participationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.memberId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    match /teams/{teamId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 5. 관리자 설정

첫 번째 사용자를 관리자로 지정하려면:
1. Firebase 콘솔 > Firestore Database
2. users 컬렉션에서 해당 사용자 문서 찾기
3. `role` 필드를 `admin`으로 변경

### 6. 개발 서버 실행

```bash
npm run dev
```

## 배포

### GitHub Pages 배포

```bash
npm run deploy
```

## 프로젝트 구조

```
src/
├── components/       # 재사용 컴포넌트
│   ├── Layout.jsx
│   ├── Navbar.jsx
│   ├── PrivateRoute.jsx
│   └── LoadingSpinner.jsx
├── pages/            # 페이지 컴포넌트
│   ├── Login.jsx
│   ├── ProfileSetup.jsx
│   ├── Dashboard.jsx
│   ├── Members.jsx
│   ├── WorldWar.jsx
│   ├── Teams.jsx
│   └── Settings.jsx
├── contexts/         # React Context
│   └── AuthContext.jsx
├── firebase/         # Firebase 설정
│   └── config.js
├── hooks/            # 커스텀 훅
│   └── useAuth.js
├── App.jsx
├── main.jsx
└── index.css
```

## 라이선스

MIT License
