#!/bin/bash

# TruthSync Gemma-3n Backend Installation Script
# This script sets up the Python environment and installs all required dependencies

set -e  # Exit on any error

echo "🚀 TruthSync Gemma-3n Backend Installation Script"
echo "=================================================="

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

# Install PyTorch first (CPU version)
echo "🔥 Installing PyTorch (CPU version)..."
pip install torch==2.1.0 torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cpu

# Install other dependencies
echo "📦 Installing other dependencies..."
pip install -r requirements.txt

# Verify installation
echo "🔍 Verifying installation..."
python3 -c "
import fastapi
import torch
import transformers
import uvicorn
import PIL
print('✅ All core dependencies installed successfully!')
"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# TruthSync Backend Configuration
ENVIRONMENT=development
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["*"]
MAX_FILE_SIZE=10485760
MODEL_NAME=google/gemma-3n-e4b-it
DEVICE=cpu
EOF
    echo "✅ .env file created"
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
echo "🎉 Installation completed successfully!"
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