#!/bin/bash

# Gemma-3n 백엔드 서버 실행 스크립트

echo "🚀 Gemma-3n 백엔드 서버를 시작합니다..."

# 현재 디렉토리 확인
if [ ! -f "gemma3n_backend.py" ]; then
    echo "❌ gemma3n_backend.py 파일을 찾을 수 없습니다."
    echo "올바른 디렉토리에서 실행해주세요."
    exit 1
fi

# Python 가상환경 확인 및 활성화
if [ -d "gemma-venv" ]; then
    echo "📦 Python 가상환경을 활성화합니다..."
    source gemma-venv/bin/activate
else
    echo "⚠️  가상환경이 없습니다. 시스템 Python을 사용합니다."
fi

# 필요한 패키지 설치 확인
echo "🔍 필요한 패키지를 확인합니다..."
python3 -c "
import fastapi
import uvicorn
import transformers
import torch
print('✅ 모든 패키지가 설치되어 있습니다.')
" 2>/dev/null || {
    echo "📦 필요한 패키지를 설치합니다..."
    pip install fastapi uvicorn python-multipart transformers torch
}

# 서버 실행
echo "🌐 백엔드 서버를 시작합니다..."
echo "📍 서버 주소: http://localhost:8000"
echo "📖 API 문서: http://localhost:8000/docs"
echo ""
echo "서버를 중지하려면 Ctrl+C를 누르세요."
echo ""

python3 gemma3n_backend.py 