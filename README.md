# TruthSync - AI-Powered Real-time Journalism System

TruthSync는 Google의 Gemma-3n AI 모델을 활용한 혁신적인 실시간 저널리즘 플랫폼입니다. 위치 기반 검증과 WebSocket을 통한 실시간 알림을 통해 진실성 있는 뉴스를 생성하고 검증합니다.

## 🎯 프로젝트 목표

### 가짜 뉴스 문제 해결
- **AI 기반 뉴스 생성**: Gemma-3n 모델을 활용한 정확한 기사 작성
- **위치 기반 검증**: 1km 반경 내 목격자들의 실시간 검증
- **투명한 AI**: 완전히 통제된 플랫폼에서의 AI 저널리즘

### 기술적 혁신
- **실시간 스트리밍**: TextStreamer를 통한 점진적 텍스트 생성
- **위치 기반 알림**: WebSocket을 통한 실시간 검증 요청
- **모바일 최적화**: 반응형 디자인과 터치 친화적 인터페이스

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/gemma-3n-truthsync.git
cd gemma-3n-truthsync/gemma-3n-product
```

### 2. 자동 설치 및 실행
```bash
chmod +x install_dependencies.sh
./install_dependencies.sh

chmod +x deploy-gemma3n-product.sh
./deploy-gemma3n-product.sh
```

### 3. 브라우저에서 접속
스크립트 실행 후 제공되는 URL로 접속하여 사용하세요.

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

## 🏗️ 프로젝트 구조

```
gemma-3n-truthsync/
├── gemma-3n-product/           # 메인 애플리케이션
│   ├── gemma3n_backend.py      # FastAPI 백엔드
│   ├── frontend/truthsync/     # Angular 프론트엔드
│   ├── install_dependencies.sh  # 설치 스크립트
│   ├── deploy-gemma3n-product.sh # 배포 스크립트
│   └── README.md               # 상세 설치 가이드
├── README.md                   # 이 파일
└── .gitignore                  # Git 무시 파일
```

## 🛠️ 상세 설치 가이드

자세한 설치 및 사용 방법은 [gemma-3n-product/README.md](./gemma-3n-product/README.md)를 참조하세요.

### 주요 문서
- **[상세 설치 가이드](./gemma-3n-product/README.md)**: 단계별 설치 방법
- **[INSTALLATION.md](./gemma-3n-product/INSTALLATION.md)**: 고급 설치 옵션
- **[문제 해결](./gemma-3n-product/README.md#🚨-문제-해결)**: 일반적인 문제 해결

## 🔧 기술 스택

### 백엔드
- **Python**: FastAPI, uvicorn
- **AI**: Google Gemma-3n-E4B-it
- **데이터베이스**: SQLite
- **실시간 통신**: WebSocket

### 프론트엔드
- **Angular**: 17+
- **TypeScript**: 타입 안전성
- **Material Design**: 모던 UI/UX
- **Tailwind CSS**: 스타일링

### 배포
- **ngrok**: 외부 접근 터널링
- **HTTP Server**: 정적 파일 서빙
- **자동화 스크립트**: 원클릭 배포

## 🚨 문제 해결

### 일반적인 문제들

#### 1. 의존성 설치 오류
```bash
cd gemma-3n-product
rm -rf gemma-venv
./install_dependencies.sh
```

#### 2. 포트 충돌
```bash
# 사용 중인 포트 확인
lsof -i :8000  # 백엔드
lsof -i :4200  # 프론트엔드
```

#### 3. ngrok 연결 오류
```bash
# ngrok 재시작
pkill ngrok
ngrok start --all
```

## 📊 성능 최적화

### 메모리 사용량
- **백엔드**: ~4GB RAM
- **프론트엔드**: ~500MB RAM
- **총 사용량**: ~5GB RAM

### GPU 사용 (선택사항)
```bash
cd gemma-3n-product
./install_dependencies_gpu.sh
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
- **Documentation**: [gemma-3n-product/README.md](./gemma-3n-product/README.md)

---

**TruthSync** - 진실성 있는 뉴스의 미래를 만들어갑니다. 🚀 