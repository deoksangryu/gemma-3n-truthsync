#!/bin/bash

# Gemma-3n 프론트엔드만 실행 스크립트
# 클라이언트 사이드 AI 분석을 위한 프론트엔드 전용 실행 + ngrok 터널링

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

# 스크립트 디렉토리로 이동
cd "$(dirname "$0")"

echo "=================================================="
echo "🌐 Gemma-3n 프론트엔드 전용 실행"
echo "=================================================="
echo
log_info "클라이언트 사이드 AI 분석 모드로 실행합니다"
echo

# Node.js 확인
if ! command -v node &> /dev/null; then
    log_error "Node.js가 설치되어 있지 않습니다"
    log_info "Node.js를 설치한 후 다시 시도해주세요"
    exit 1
fi

# npm 확인
if ! command -v npm &> /dev/null; then
    log_error "npm이 설치되어 있지 않습니다"
    log_info "npm을 설치한 후 다시 시도해주세요"
    exit 1
fi

# ngrok 확인
if ! command -v ngrok &> /dev/null; then
    log_warning "ngrok이 설치되어 있지 않습니다"
    log_info "ngrok을 설치하거나 수동으로 설치해주세요"
    log_info "설치 방법: https://ngrok.com/download"
    read -p "ngrok 없이 계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    USE_NGROK=false
else
    USE_NGROK=true
fi

# 프론트엔드 디렉토리 확인
if [ ! -d "frontend/truthsync" ]; then
    log_error "프론트엔드 디렉토리를 찾을 수 없습니다"
    log_info "frontend/truthsync 디렉토리가 존재하는지 확인해주세요"
    exit 1
fi

# 프론트엔드 디렉토리로 이동
cd frontend/truthsync

log_step "프론트엔드 의존성 설치 중..."
npm install

if [ $? -ne 0 ]; then
    log_error "npm 의존성 설치에 실패했습니다"
    exit 1
fi

log_success "의존성 설치 완료"

# 포트 확인
PORT=4200
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    log_warning "포트 $PORT가 이미 사용 중입니다"
    log_info "다른 포트를 사용하거나 기존 프로세스를 종료해주세요"
    read -p "계속하려면 Enter를 누르세요 (Ctrl+C로 취소): "
fi

# 기존 ngrok 프로세스 종료
if [ "$USE_NGROK" = true ]; then
    log_step "기존 ngrok 프로세스 종료 중..."
    pkill -f "ngrok" 2>/dev/null || true
    sleep 2
fi

log_step "Angular 개발 서버 시작 중..."
echo
log_success "프론트엔드가 http://localhost:$PORT 에서 실행됩니다"
log_info "클라이언트 사이드 AI 분석이 활성화되어 있습니다"
log_info "브라우저에서 http://localhost:$PORT 로 접속하세요"
echo
log_info "특징:"
echo "  ✅ 백엔드 서버 없이 동작"
echo "  ✅ 클라이언트 사이드 AI 분석"
echo "  ✅ 오프라인 지원"
echo "  ✅ 개인정보 보호 (이미지가 서버로 전송되지 않음)"
echo

# Angular 개발 서버를 백그라운드에서 시작
log_info "Angular 개발 서버를 백그라운드에서 시작합니다..."
ng serve --host 0.0.0.0 --port $PORT --allowed-hosts all > angular.log 2>&1 &
ANGULAR_PID=$!

# 서버가 시작될 때까지 대기
log_info "서버 시작을 기다리는 중..."
sleep 10

# 서버가 정상적으로 시작되었는지 확인
if ! curl -s http://localhost:$PORT > /dev/null; then
    log_error "Angular 서버가 정상적으로 시작되지 않았습니다"
    kill $ANGULAR_PID 2>/dev/null || true
    exit 1
fi

log_success "Angular 개발 서버가 성공적으로 시작되었습니다"

# ngrok 터널링 시작
if [ "$USE_NGROK" = true ]; then
    log_step "ngrok 터널링 시작 중..."
    
    # ngrok 설정 파일 확인
    NGROK_CONFIG="$HOME/.ngrok2/ngrok.yml"
    if [ -f "$NGROK_CONFIG" ]; then
        log_info "ngrok 설정 파일을 사용합니다: $NGROK_CONFIG"
        ngrok http $PORT --config "$NGROK_CONFIG" > ngrok_frontend.log 2>&1 &
    else
        log_info "기본 ngrok 설정으로 실행합니다"
        ngrok http $PORT > ngrok_frontend.log 2>&1 &
    fi
    
    NGROK_PID=$!
    
    # ngrok이 시작될 때까지 대기
    log_info "ngrok 터널링을 기다리는 중..."
    sleep 5
    
    # ngrok URL 가져오기
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*' | cut -d'"' -f4 | head -1)
    
    if [ -n "$NGROK_URL" ]; then
        log_success "ngrok 터널링이 성공적으로 시작되었습니다"
        echo
        echo "=================================================="
        echo "🌐 외부 접속 URL"
        echo "=================================================="
        echo -e "${GREEN}외부 URL:${NC} $NGROK_URL"
        echo -e "${BLUE}로컬 URL:${NC} http://localhost:$PORT"
        echo
        log_info "외부에서 위 URL로 접속하여 테스트할 수 있습니다"
        echo "=================================================="
        echo
    else
        log_warning "ngrok URL을 가져올 수 없습니다"
        log_info "ngrok_frontend.log 파일을 확인해주세요"
    fi
else
    echo
    echo "=================================================="
    echo "🌐 로컬 접속 URL"
    echo "=================================================="
    echo -e "${BLUE}로컬 URL:${NC} http://localhost:$PORT"
    echo
    log_info "ngrok 없이 로컬에서만 실행됩니다"
    echo "=================================================="
    echo
fi

log_info "종료하려면 Ctrl+C를 누르세요"
echo

# 프로세스 모니터링
trap 'cleanup' INT TERM

cleanup() {
    log_step "서비스 종료 중..."
    
    # Angular 서버 종료
    if [ -n "$ANGULAR_PID" ]; then
        kill $ANGULAR_PID 2>/dev/null || true
        log_info "Angular 개발 서버를 종료했습니다"
    fi
    
    # ngrok 종료
    if [ -n "$NGROK_PID" ]; then
        kill $NGROK_PID 2>/dev/null || true
        log_info "ngrok 터널을 종료했습니다"
    fi
    
    log_success "모든 서비스가 종료되었습니다"
    exit 0
}

# 프로세스 상태 모니터링
while true; do
    # Angular 서버 상태 확인
    if ! kill -0 $ANGULAR_PID 2>/dev/null; then
        log_error "Angular 서버가 비정상적으로 종료되었습니다"
        break
    fi
    
    # ngrok 상태 확인 (ngrok이 있는 경우)
    if [ "$USE_NGROK" = true ] && [ -n "$NGROK_PID" ]; then
        if ! kill -0 $NGROK_PID 2>/dev/null; then
            log_warning "ngrok 터널이 비정상적으로 종료되었습니다"
        fi
    fi
    
    sleep 10
done 