#!/bin/bash

# Gemma-3n Product 범용 배포 스크립트
# 외부 PC에서도 동일하게 동작하도록 환경을 자동으로 설정하고 실행

set -e  # 오류 발생시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로그 함수
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

# 시스템 정보 확인
check_system() {
    log_step "시스템 환경 확인 중..."
    
    # OS 확인
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
    else
        log_error "지원되지 않는 운영체제입니다: $OSTYPE"
        exit 1
    fi
    
    log_success "운영체제: $OS"
    
    # 필수 명령어 확인
    local required_commands=("python3" "npm" "curl" "git")
    for cmd in "${required_commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd이 설치되어 있지 않습니다"
            exit 1
        fi
    done
    
    log_success "필수 명령어 확인 완료"
}

# Python 가상환경 설정
setup_python_venv() {
    log_step "Python 가상환경 설정 중..."
    
    if [ ! -d "gemma-venv" ]; then
        log_info "Python 가상환경 생성 중..."
        python3 -m venv gemma-venv
        log_success "가상환경 생성 완료"
    fi
    
    # 가상환경 활성화
    source gemma-venv/bin/activate
    
    # pip 업그레이드
    pip install --upgrade pip setuptools wheel
    
    # Gemma-3n 의존성 설치
    log_info "Gemma-3n 의존성 설치 중..."
    pip install fastapi uvicorn python-multipart transformers torch
    
    log_success "Python 환경 설정 완료"
}

# Node.js 의존성 설정
setup_node_deps() {
    log_step "Node.js 의존성 설정 중..."
    
    if [ ! -d "frontend/truthsync/node_modules" ]; then
        log_info "npm 의존성 설치 중..."
        cd frontend/truthsync
        npm install
        cd ../..
        log_success "npm 의존성 설치 완료"
    else
        log_info "npm 의존성이 이미 설치되어 있습니다"
    fi
}

# ngrok 설치 및 설정
setup_ngrok() {
    log_step "ngrok 설정 중..."
    
    if ! command -v ngrok &> /dev/null; then
        log_info "ngrok 설치 중..."
        
        if [[ "$OS" == "macOS" ]]; then
            # macOS용 ngrok 설치
            if command -v brew &> /dev/null; then
                brew install ngrok/ngrok/ngrok
            else
                log_error "Homebrew가 설치되어 있지 않습니다. ngrok을 수동으로 설치해주세요."
                log_info "https://ngrok.com/download 에서 다운로드하세요."
                exit 1
            fi
        elif [[ "$OS" == "Linux" ]]; then
            # Linux용 ngrok 설치
            wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
            tar -xzf ngrok-v3-stable-linux-amd64.tgz
            sudo mv ngrok /usr/local/bin/
            rm ngrok-v3-stable-linux-amd64.tgz
        fi
        
        log_success "ngrok 설치 완료"
    else
        log_info "ngrok이 이미 설치되어 있습니다"
    fi
    
    # ngrok 인증 확인
    if ! ngrok config check &> /dev/null; then
        log_warning "ngrok 인증이 필요합니다."
        log_info "ngrok 웹사이트에서 인증 토큰을 받아 다음 명령어를 실행하세요:"
        echo "ngrok config add-authtoken YOUR_TOKEN"
        log_info "인증 후 스크립트를 다시 실행하세요."
        exit 1
    fi
}

# http-server 설치
setup_http_server() {
    log_step "http-server 설정 중..."
    
    if ! command -v http-server &> /dev/null; then
        log_info "http-server 설치 중..."
        npm install -g http-server
        log_success "http-server 설치 완료"
    else
        log_info "http-server가 이미 설치되어 있습니다"
    fi
}

# 기존 프로세스 종료
cleanup_processes() {
    log_info "기존 프로세스 정리 중..."
    
    # Python 백엔드 종료
    pkill -f "gemma3n_backend.py" 2>/dev/null || true
    pkill -f "uvicorn.*gemma3n_backend" 2>/dev/null || true
    
    # http-server 종료
    pkill -f "http-server" 2>/dev/null || true
    
    # ngrok 종료
    pkill -f "ngrok" 2>/dev/null || true
    
    sleep 2
    log_success "기존 프로세스 정리 완료"
}

# 백엔드 시작
start_backend() {
    log_step "Gemma-3n 백엔드 시작 중..."
    
    if [ ! -f "gemma3n_backend.py" ]; then
        log_error "gemma3n_backend.py 파일을 찾을 수 없습니다"
        exit 1
    fi
    
    # 백엔드를 백그라운드에서 실행
    nohup python gemma3n_backend.py > ngrok_backend.log 2>&1 &
    BACKEND_PID=$!
    
    # 백엔드가 시작될 때까지 대기
    log_info "백엔드 시작 대기 중..."
    for i in {1..60}; do
        if curl -s http://localhost:8000 > /dev/null 2>&1; then
            log_success "백엔드가 성공적으로 시작되었습니다 (PID: $BACKEND_PID)"
            return 0
        fi
        sleep 1
    done
    
    log_error "백엔드 시작에 실패했습니다"
    exit 1
}

# ngrok 시작
start_ngrok() {
    log_step "ngrok 터널 시작 중..."
    
    # ngrok을 백그라운드에서 실행
    nohup ngrok start --all > ngrok_proxy.log 2>&1 &
    NGROK_PID=$!
    
    # ngrok API가 준비될 때까지 대기
    log_info "ngrok API 준비 대기 중..."
    for i in {1..60}; do
        if curl -s http://127.0.0.1:4040/api/tunnels > /dev/null 2>&1; then
            log_success "ngrok이 성공적으로 시작되었습니다 (PID: $NGROK_PID)"
            return 0
        fi
        sleep 1
    done
    
    log_error "ngrok 시작에 실패했습니다"
    exit 1
}

# ngrok에서 백엔드 URL 추출
get_backend_url() {
    log_info "백엔드 ngrok URL 추출 중..." >&2
    
    for i in {1..30}; do
        BACKEND_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for tunnel in data['tunnels']:
        if tunnel['config']['addr'] == 'http://localhost:8000':
            print(tunnel['public_url'])
            break
except:
    pass
" 2>/dev/null)
        
        if [ ! -z "$BACKEND_URL" ]; then
            log_success "백엔드 URL: $BACKEND_URL" >&2
            echo $BACKEND_URL
            return 0
        fi
        
        sleep 2
    done
    
    log_error "백엔드 ngrok URL을 찾을 수 없습니다" >&2
    exit 1
}

# 프론트엔드 환경 설정 업데이트
update_frontend_config() {
    local backend_url=$1
    log_info "프론트엔드 환경 설정 업데이트 중..." >&2
    
    # frontend/truthsync/src/environments/environment.ts 파일 생성
    mkdir -p frontend/truthsync/src/environments
    cat > frontend/truthsync/src/environments/environment.ts << EOF
export const environment = {
  production: false,
  apiUrl: '$backend_url'
};
EOF
    
    log_success "환경 설정이 업데이트되었습니다: $backend_url" >&2
}

# 프론트엔드 빌드
build_frontend() {
    log_step "TruthSync 프론트엔드 빌드 중..."
    cd frontend/truthsync
    
    if [ ! -f "package.json" ]; then
        log_error "package.json 파일을 찾을 수 없습니다"
        exit 1
    fi
    
    # 빌드 실행
    npm run build
    
    if [ $? -eq 0 ]; then
        log_success "프론트엔드 빌드 완료"
    else
        log_error "프론트엔드 빌드에 실패했습니다"
        exit 1
    fi
    
    cd ../..
}

# 프론트엔드 서버 시작
start_frontend() {
    log_step "TruthSync 프론트엔드 서버 시작 중..."
    
    # 프론트엔드 서버를 백그라운드에서 실행
    nohup http-server frontend/truthsync/dist/truthsync/browser -p 4200 --cors -c-1 > ngrok_frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # 프론트엔드 서버가 시작될 때까지 대기
    log_info "프론트엔드 서버 시작 대기 중..."
    for i in {1..30}; do
        if curl -s http://localhost:4200 > /dev/null 2>&1; then
            log_success "프론트엔드 서버가 성공적으로 시작되었습니다 (PID: $FRONTEND_PID)"
            return 0
        fi
        sleep 1
    done
    
    log_error "프론트엔드 서버 시작에 실패했습니다"
    exit 1
}

# 상태 확인 및 URL 표시
show_status() {
    log_step "서비스 상태 확인 중..."
    
    # ngrok URL 정보 가져오기
    FRONTEND_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for tunnel in data['tunnels']:
        if tunnel['config']['addr'] == 'http://localhost:4200':
            print(tunnel['public_url'])
            break
except:
    pass
" 2>/dev/null)
    
    BACKEND_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for tunnel in data['tunnels']:
        if tunnel['config']['addr'] == 'http://localhost:8000':
            print(tunnel['public_url'])
            break
except:
    pass
" 2>/dev/null)
    
    echo
    echo "=================================================="
    log_success "🎉 Gemma-3n Product가 성공적으로 배포되었습니다!"
    echo "=================================================="
    echo
    echo -e "${GREEN}📱 TruthSync 프론트엔드:${NC} $FRONTEND_URL"
    echo -e "${BLUE}🔧 Gemma-3n 백엔드:${NC} $BACKEND_URL"
    echo -e "${YELLOW}🌐 ngrok 대시보드:${NC} http://127.0.0.1:4040"
    echo
    echo "로그 파일:"
    echo "  - 백엔드: ngrok_backend.log"
    echo "  - 프론트엔드: ngrok_frontend.log"
    echo "  - ngrok: ngrok_proxy.log"
    echo
    echo -e "${CYAN}📋 사용 방법:${NC}"
    echo "  1. 프론트엔드 URL로 접속하여 이미지 업로드"
    echo "  2. 이미지와 부연설명을 입력하여 기사 생성"
    echo "  3. 종료하려면 Ctrl+C를 누르세요"
    echo
    echo -e "${YELLOW}⚠️  종료하려면 Ctrl+C를 누르세요${NC}"
    echo "=================================================="
}

# 신호 처리 (Ctrl+C 등)
cleanup_on_exit() {
    echo
    log_info "애플리케이션을 종료하는 중..."
    cleanup_processes
    log_success "모든 프로세스가 종료되었습니다"
    exit 0
}

# 메인 실행 함수
main() {
    echo "=================================================="
    echo "🤖 Gemma-3n Product 범용 배포 스크립트"
    echo "=================================================="
    
    # 신호 처리 설정
    trap cleanup_on_exit INT TERM
    
    # 단계별 실행
    check_system
    setup_python_venv
    setup_node_deps
    setup_ngrok
    setup_http_server
    cleanup_processes
    start_backend
    start_ngrok
    
    # 백엔드 URL 가져오기 및 프론트엔드 설정 업데이트
    BACKEND_URL=$(get_backend_url)
    update_frontend_config "$BACKEND_URL"
    
    # 프론트엔드 빌드 및 실행
    build_frontend
    start_frontend
    
    # 상태 표시
    show_status
    
    # 무한 대기 (사용자가 Ctrl+C로 종료할 때까지)
    while true; do
        sleep 1
    done
}

# 스크립트 실행
main "$@" 