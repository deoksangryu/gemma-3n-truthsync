# TruthSync - AI-Powered Real-time Journalism System

TruthSync는 Gemma-3n AI 모델을 활용한 실시간 저널리즘 시스템입니다. 위치 기반 검증과 WebSocket을 통한 실시간 알림을 통해 진실성 있는 뉴스를 생성하고 검증합니다.

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/gemma-3n-truthsync.git
cd gemma-3n-truthsync/gemma-3n-product
```

### 2. 백엔드 의존성 설치 (CPU 버전)
```bash
chmod +x install_dependencies.sh
./install_dependencies.sh
```

### 3. 프론트엔드 의존성 설치
```bash
cd frontend/truthsync
npm install
```

### 4. 애플리케이션 실행
```bash
cd ../..  # gemma-3n-product 디렉토리로 이동
chmod +x deploy-gemma3n-product.sh
./deploy-gemma3n-product.sh
```

## 📋 시스템 요구사항

### 최소 요구사항
- **OS**: macOS, Linux, Windows (WSL)
- **Python**: 3.9+
- **Node.js**: 18+
- **RAM**: 8GB+
- **저장공간**: 10GB+

### 권장사항
- **RAM**: 16GB+
- **GPU**: NVIDIA GPU (CUDA 지원)
- **저장공간**: 20GB+

## 🔧 상세 설치 가이드

### 백엔드 설치

#### CPU 버전 (권장)
```bash
# 의존성 설치
./install_dependencies.sh

# 가상환경 활성화
source gemma-venv/bin/activate

# 백엔드 실행
python gemma3n_backend.py
```

#### GPU 버전 (선택사항)
```bash
# GPU 의존성 설치
./install_dependencies_gpu.sh

# 가상환경 활성화
source gemma-venv/bin/activate

# 백엔드 실행
python gemma3n_backend.py
```

### 프론트엔드 설치

```bash
cd frontend/truthsync

# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 또는 빌드
npm run build
```

## 🌐 배포 옵션

### 1. 전체 스택 배포 (권장)
```bash
./deploy-gemma3n-product.sh
```
- 백엔드, 프론트엔드, ngrok 터널을 모두 자동으로 시작
- 환경 설정 자동 업데이트
- 외부 접근 가능한 URL 제공

### 2. 백엔드만 실행
```bash
./start_backend.sh
```

### 3. 프론트엔드만 실행
```bash
./start-frontend-only.sh
```

## 🏗️ 프로젝트 구조

```
gemma-3n-product/
├── gemma3n_backend.py          # FastAPI 백엔드 서버
├── requirements.txt             # Python 의존성 (CPU)
├── requirements-gpu.txt         # Python 의존성 (GPU)
├── install_dependencies.sh      # CPU 의존성 설치 스크립트
├── install_dependencies_gpu.sh  # GPU 의존성 설치 스크립트
├── deploy-gemma3n-product.sh   # 전체 배포 스크립트
├── start_backend.sh            # 백엔드 시작 스크립트
├── start-frontend-only.sh      # 프론트엔드 시작 스크립트
├── frontend/                   # Angular 프론트엔드
│   └── truthsync/
│       ├── src/
│       │   ├── app/
│       │   │   ├── screens/    # 화면 컴포넌트
│       │   │   ├── services/   # 서비스 (AI, 위치, 알림)
│       │   │   └── shared/     # 공유 컴포넌트
│       │   └── environments/   # 환경 설정
│       └── package.json
├── gemma-venv/                 # Python 가상환경
├── truthsync_articles.db       # SQLite 데이터베이스
└── README.md                   # 이 파일
```

## 🔍 주요 기능

### 1. AI 기반 뉴스 생성
- **모델**: Google Gemma-3n-E4B-it
- **입력**: 이미지 + 부연설명
- **출력**: 구조화된 뉴스 기사
- **스트리밍**: 실시간 텍스트 생성

### 2. 위치 기반 검증 시스템
- **GPS 추적**: 실시간 위치 업데이트
- **반경 검색**: 1km 내 사용자 조회
- **WebSocket**: 실시간 알림 전송
- **검증 요청**: 근처 사용자에게 리뷰 요청

### 3. 실시간 알림 시스템
- **WebSocket 연결**: 실시간 통신
- **브라우저 알림**: 사용자 알림
- **알림 배지**: 읽지 않은 알림 표시
- **알림 관리**: 읽음 처리 및 히스토리

### 4. 데이터베이스 관리
- **SQLite**: 경량 데이터베이스
- **기사 저장**: 생성된 뉴스 저장
- **검증 기록**: 사용자 검증 데이터
- **위치 추적**: 사용자 위치 히스토리

## 🛠️ API 엔드포인트

### 백엔드 API
- `POST /generate-article` - 기사 생성
- `POST /generate-article-stream` - 스트리밍 기사 생성
- `GET /articles` - 기사 목록 조회
- `POST /articles/{id}/verify` - 기사 검증
- `GET /health` - 서버 상태 확인

### WebSocket API
- `WS /ws/{user_id}` - 실시간 연결
- `POST /users/{user_id}/location` - 위치 업데이트
- `GET /users/nearby` - 근처 사용자 조회
- `GET /notifications/{user_id}` - 알림 조회

## 🔧 환경 설정

### 환경 변수
```bash
# .env 파일 생성
WEBSOCKET_ENABLED=true
NOTIFICATION_RADIUS_KM=1.0
MODEL_DEVICE=cpu  # 또는 gpu
```

### ngrok 설정
```bash
# ngrok 설치
npm install -g ngrok

# ngrok 인증 (선택사항)
ngrok authtoken YOUR_TOKEN
```

## 🚨 문제 해결

### 일반적인 문제들

#### 1. Python 의존성 오류
```bash
# 가상환경 재생성
rm -rf gemma-venv
python3 -m venv gemma-venv
source gemma-venv/bin/activate
pip install -r requirements.txt
```

#### 2. Node.js 의존성 오류
```bash
cd frontend/truthsync
rm -rf node_modules package-lock.json
npm install
```

#### 3. ngrok 연결 오류
```bash
# ngrok 프로세스 확인
ps aux | grep ngrok

# ngrok 재시작
pkill ngrok
ngrok start --all
```

#### 4. 포트 충돌
```bash
# 사용 중인 포트 확인
lsof -i :8000  # 백엔드
lsof -i :4200  # 프론트엔드
lsof -i :4040  # ngrok
```

### 로그 확인
```bash
# 백엔드 로그
tail -f ngrok_backend.log

# 프론트엔드 로그
tail -f ngrok_frontend.log

# ngrok 로그
tail -f ngrok_proxy.log
```

## 📊 성능 최적화

### 메모리 사용량
- **백엔드**: ~4GB RAM
- **프론트엔드**: ~500MB RAM
- **총 사용량**: ~5GB RAM

### GPU 사용 (선택사항)
```bash
# GPU 버전 설치
./install_dependencies_gpu.sh

# GPU 확인
python -c "import torch; print(torch.cuda.is_available())"
```

## 🔒 보안 고려사항

### 데이터 보호
- **위치 데이터**: 로컬 저장, 암호화 없음
- **이미지 데이터**: 임시 저장, 자동 삭제
- **사용자 데이터**: SQLite 로컬 저장

### 네트워크 보안
- **ngrok**: HTTPS 터널링
- **CORS**: 프론트엔드 도메인 허용
- **WebSocket**: 실시간 보안 연결

## 🤝 기여하기

### 개발 환경 설정
```bash
# 저장소 포크
git clone https://github.com/your-username/gemma-3n-truthsync.git

# 브랜치 생성
git checkout -b feature/your-feature

# 변경사항 커밋
git add .
git commit -m "Add your feature"

# Pull Request 생성
```

### 코드 스타일
- **Python**: PEP 8
- **TypeScript**: ESLint
- **HTML/CSS**: Prettier

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🙏 감사의 말

- **Google**: Gemma-3n 모델 제공
- **Hugging Face**: Transformers 라이브러리
- **FastAPI**: 백엔드 프레임워크
- **Angular**: 프론트엔드 프레임워크

## 📞 지원

문제가 발생하거나 질문이 있으시면:
- **Issues**: GitHub Issues 페이지
- **Email**: your-email@example.com
- **Documentation**: [INSTALLATION.md](./INSTALLATION.md)

---

**TruthSync** - 진실성 있는 뉴스의 미래를 만들어갑니다. 🚀 