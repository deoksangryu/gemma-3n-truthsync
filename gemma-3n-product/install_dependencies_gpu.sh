#!/bin/bash

# TruthSync Gemma-3n Backend GPU Installation Script
# This script sets up the Python environment with GPU support

set -e  # Exit on any error

echo "🚀 TruthSync Gemma-3n Backend GPU Installation Script"
echo "====================================================="

# Check if Python 3.9+ is installed
echo "📋 Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1,2)
required_version="3.9"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" = "$required_version" ]; then
    echo "✅ Python $python_version is compatible (requires 3.9+)"
else
    echo "❌ Python $python_version is too old. Please install Python 3.9 or higher."
    exit 1
fi

# Check for NVIDIA GPU
echo "🔍 Checking for NVIDIA GPU..."
if command -v nvidia-smi &> /dev/null; then
    echo "✅ NVIDIA GPU detected:"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits
else
    echo "⚠️  NVIDIA GPU not detected. This script is for GPU installation."
    echo "   If you don't have a GPU, use install_dependencies.sh instead."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check CUDA version
echo "🔍 Checking CUDA version..."
if command -v nvcc &> /dev/null; then
    cuda_version=$(nvcc --version | grep "release" | awk '{print $6}' | cut -d. -f1,2)
    echo "✅ CUDA $cuda_version detected"
    
    # Check if CUDA version is compatible
    if [[ "$cuda_version" == "11.8" ]] || [[ "$cuda_version" == "12.1" ]]; then
        echo "✅ CUDA version is compatible"
    else
        echo "⚠️  CUDA $cuda_version detected. PyTorch 2.1.0 supports CUDA 11.8 and 12.1."
        echo "   You may need to adjust the PyTorch version in requirements-gpu.txt"
    fi
else
    echo "⚠️  CUDA not detected. Make sure CUDA is properly installed."
fi

# Create virtual environment
echo "🔧 Creating virtual environment..."
if [ -d "gemma-venv" ]; then
    echo "⚠️  Virtual environment already exists. Removing old one..."
    rm -rf gemma-venv
fi

python3 -m venv gemma-venv
echo "✅ Virtual environment created: gemma-venv"

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source gemma-venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install PyTorch with GPU support
echo "🔥 Installing PyTorch with GPU support..."
pip install torch==2.1.0+cu118 torchvision==0.16.0+cu118 --index-url https://download.pytorch.org/whl/cu118

# Install other dependencies
echo "📦 Installing other dependencies..."
pip install -r requirements-gpu.txt

# Verify GPU installation
echo "🔍 Verifying GPU installation..."
python3 -c "
import torch
import fastapi
import transformers
import uvicorn
import PIL

print('✅ All core dependencies installed successfully!')
print(f'🔥 PyTorch version: {torch.__version__}')
print(f'🔥 CUDA available: {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'🔥 CUDA version: {torch.version.cuda}')
    print(f'🔥 GPU device: {torch.cuda.get_device_name(0)}')
    print(f'🔥 GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB')
else:
    print('⚠️  CUDA not available. Check your GPU drivers.')
"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# TruthSync Backend Configuration (GPU)
ENVIRONMENT=development
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["*"]
MAX_FILE_SIZE=10485760
MODEL_NAME=google/gemma-3n-e4b-it
DEVICE=cuda
EOF
    echo "✅ .env file created with GPU configuration"
fi

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads
echo "✅ uploads directory created"

# Set permissions
echo "🔐 Setting file permissions..."
chmod +x start_backend.sh
chmod +x deploy-gemma3n-product.sh
echo "✅ Scripts made executable"

echo ""
echo "🎉 GPU Installation completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Activate virtual environment: source gemma-venv/bin/activate"
echo "2. Start the backend: ./start_backend.sh"
echo "3. Or run directly: python gemma3n_backend.py"
echo ""
echo "🔗 API Documentation will be available at: http://localhost:8000/docs"
echo "🏥 Health check: http://localhost:8000/health"
echo ""
echo "⚠️  Note: First run will download the Gemma-3n model (~8GB)"
echo "   This may take several minutes depending on your internet connection."
echo ""
echo "🚀 GPU acceleration is enabled for faster inference!"
echo "" 