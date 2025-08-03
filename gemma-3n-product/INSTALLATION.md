# TruthSync Backend Installation Guide

## 📋 Prerequisites

### System Requirements
- **Python**: 3.9 or higher
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: At least 10GB free space
- **OS**: macOS, Linux, or Windows
- **GPU**: Optional but recommended for faster inference

### GPU Requirements (Optional)
- **NVIDIA GPU**: CUDA-compatible graphics card
- **CUDA**: Version 11.8 or 12.1
- **VRAM**: Minimum 8GB (16GB recommended for large models)

## 🚀 Quick Installation

### Option 1: CPU Installation (Recommended for beginners)
```bash
# Navigate to project directory
cd gemma-3n-product

# Run CPU installation script
./install_dependencies.sh
```

### Option 2: GPU Installation (For users with NVIDIA GPU)
```bash
# Navigate to project directory
cd gemma-3n-product

# Run GPU installation script
./install_dependencies_gpu.sh
```

## 📦 Manual Installation

### 1. Create Virtual Environment
```bash
python3 -m venv gemma-venv
source gemma-venv/bin/activate  # On Windows: gemma-venv\Scripts\activate
```

### 2. Install Dependencies

#### For CPU:
```bash
pip install --upgrade pip
pip install torch==2.1.0 torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

#### For GPU:
```bash
pip install --upgrade pip
pip install torch==2.1.0+cu118 torchvision==0.16.0+cu118 --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements-gpu.txt
```

### 3. Verify Installation
```bash
python3 -c "
import fastapi
import torch
import transformers
import uvicorn
import PIL
print('✅ All dependencies installed successfully!')
print(f'🔥 PyTorch version: {torch.__version__}')
print(f'🔥 CUDA available: {torch.cuda.is_available()}')
"
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the project root:

```env
# TruthSync Backend Configuration
ENVIRONMENT=development
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["*"]
MAX_FILE_SIZE=10485760
MODEL_NAME=google/gemma-3n-e4b-it
DEVICE=cpu  # or cuda for GPU
```

### Directory Structure
```
gemma-3n-product/
├── gemma3n_backend.py          # Main backend server
├── requirements.txt             # CPU dependencies
├── requirements-gpu.txt         # GPU dependencies
├── install_dependencies.sh      # CPU installation script
├── install_dependencies_gpu.sh  # GPU installation script
├── start_backend.sh            # Backend startup script
├── uploads/                    # File upload directory
└── .env                        # Environment configuration
```

## 🏃‍♂️ Running the Backend

### Method 1: Using Startup Script
```bash
# Activate virtual environment
source gemma-venv/bin/activate

# Start backend
./start_backend.sh
```

### Method 2: Direct Python Execution
```bash
# Activate virtual environment
source gemma-venv/bin/activate

# Run backend directly
python gemma3n_backend.py
```

### Method 3: Using Uvicorn
```bash
# Activate virtual environment
source gemma-venv/bin/activate

# Run with uvicorn
uvicorn gemma3n_backend:app --host 0.0.0.0 --port 8000 --reload
```

## 🔍 Verification

### Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📊 Performance Considerations

### CPU vs GPU
- **CPU**: Slower but works on any machine
- **GPU**: 5-10x faster inference, requires NVIDIA GPU

### Memory Usage
- **Model Loading**: ~8GB RAM
- **Inference**: ~2-4GB RAM per request
- **Total**: 12-16GB RAM recommended

### First Run
- **Model Download**: ~8GB (one-time)
- **Download Time**: 10-30 minutes depending on internet
- **Model Caching**: Automatically cached for subsequent runs

## 🛠️ Troubleshooting

### Common Issues

#### 1. Python Version Error
```bash
# Check Python version
python3 --version

# Install Python 3.9+ if needed
# macOS: brew install python@3.9
# Ubuntu: sudo apt install python3.9
```

#### 2. CUDA Issues (GPU users)
```bash
# Check CUDA installation
nvidia-smi
nvcc --version

# Verify PyTorch CUDA support
python3 -c "import torch; print(torch.cuda.is_available())"
```

#### 3. Memory Issues
```bash
# Monitor memory usage
htop  # or top on macOS

# Reduce batch size in gemma3n_backend.py
# Change max_new_tokens from 1000 to 500
```

#### 4. Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or change port in .env file
PORT=8001
```

### Log Files
- **Backend logs**: `backend.log`
- **ngrok logs**: `ngrok_*.log`
- **Application logs**: Console output

## 🔒 Security Considerations

### Production Deployment
1. **HTTPS**: Use SSL/TLS certificates
2. **CORS**: Restrict origins to your domain
3. **Rate Limiting**: Implement request throttling
4. **Authentication**: Add API key or JWT authentication
5. **File Upload**: Validate file types and sizes

### Environment Variables
```env
# Production settings
ENVIRONMENT=production
LOG_LEVEL=WARNING
CORS_ORIGINS=["https://yourdomain.com"]
MAX_FILE_SIZE=5242880  # 5MB
```

## 📚 Additional Resources

### Documentation
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PyTorch Documentation](https://pytorch.org/docs/)
- [Transformers Documentation](https://huggingface.co/docs/transformers/)

### Community Support
- [GitHub Issues](https://github.com/your-username/truthsync/issues)
- [Discord Community](https://discord.gg/truthsync)

## 🎉 Next Steps

After successful installation:

1. **Test the API**: Use the Swagger UI at http://localhost:8000/docs
2. **Connect Frontend**: Update frontend configuration to point to backend
3. **Deploy**: Use `deploy-gemma3n-product.sh` for full deployment
4. **Monitor**: Check logs and performance metrics

---

**Need help?** Check the troubleshooting section or create an issue on GitHub! 🚀 