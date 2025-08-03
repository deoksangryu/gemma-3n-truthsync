# TruthSync - AI-Powered Real-time Journalism System

TruthSync is an innovative real-time journalism platform that leverages Google's Gemma-3n AI model to create authentic, location-based news articles. The system addresses the growing concern of fake news by implementing a controlled AI environment with location-based verification from eyewitnesses within a 1km radius.

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-username/gemma-3n-truthsync.git
cd gemma-3n-truthsync/gemma-3n-product
```

### 2. Install Backend Dependencies (CPU Version)
```bash
chmod +x install_dependencies.sh
./install_dependencies.sh
```

### 3. Install Frontend Dependencies
```bash
cd frontend/truthsync
npm install
```

### 4. Run Application
```bash
cd ../..  # Return to gemma-3n-product directory
chmod +x deploy-gemma3n-product.sh
./deploy-gemma3n-product.sh
```

## 📋 System Requirements

### Minimum Requirements
- **OS**: macOS, Linux, Windows (WSL)
- **Python**: 3.9+
- **Node.js**: 18+
- **RAM**: 8GB+
- **Storage**: 10GB+

### Recommended
- **RAM**: 16GB+
- **GPU**: NVIDIA GPU (CUDA support)
- **Storage**: 20GB+

## 🔧 Detailed Installation Guide

### Backend Installation

#### CPU Version (Recommended)
```bash
# Install dependencies
./install_dependencies.sh

# Activate virtual environment
source gemma-venv/bin/activate

# Start backend
python gemma3n_backend.py
```

#### GPU Version (Optional)
```bash
# Install GPU dependencies
./install_dependencies_gpu.sh

# Activate virtual environment
source gemma-venv/bin/activate

# Start backend
python gemma3n_backend.py
```

### Frontend Installation

```bash
cd frontend/truthsync

# Install dependencies
npm install

# Start development server
npm start

# Or build for production
npm run build
```

## 🌐 Deployment Options

### 1. Full Stack Deployment (Recommended)
```bash
./deploy-gemma3n-product.sh
```
- Automatically starts backend, frontend, and ngrok tunnel
- Auto-updates environment configuration
- Provides externally accessible URL

### 2. Backend Only
```bash
./start_backend.sh
```

### 3. Frontend Only
```bash
./start-frontend-only.sh
```

## 🏗️ Project Structure

```
gemma-3n-product/
├── gemma3n_backend.py          # FastAPI backend server
├── requirements.txt             # Python dependencies (CPU)
├── requirements-gpu.txt         # Python dependencies (GPU)
├── install_dependencies.sh      # CPU dependency installation script
├── install_dependencies_gpu.sh  # GPU dependency installation script
├── deploy-gemma3n-product.sh   # Full deployment script
├── start_backend.sh            # Backend start script
├── start-frontend-only.sh      # Frontend start script
├── frontend/                   # Angular frontend
│   └── truthsync/
│       ├── src/
│       │   ├── app/
│       │   │   ├── screens/    # Screen components
│       │   │   ├── services/   # Services (AI, location, notifications)
│       │   │   └── shared/     # Shared components
│       │   └── environments/   # Environment configuration
│       └── package.json
├── gemma-venv/                 # Python virtual environment
├── truthsync_articles.db       # SQLite database
└── README.md                   # This file
```

## 🔍 Key Features

### 1. AI-powered News Generation
- **Model**: Google Gemma-3n-E4B-it
- **Input**: Image + description
- **Output**: Structured news articles
- **Streaming**: Real-time text generation

### 2. Location-based Verification System
- **GPS Tracking**: Real-time location updates
- **Radius Search**: Find users within 1km
- **WebSocket**: Real-time notification delivery
- **Verification Requests**: Send review requests to nearby users

### 3. Real-time Notification System
- **WebSocket Connection**: Real-time communication
- **Browser Notifications**: User notifications
- **Notification Badge**: Unread notification counter
- **Notification Management**: Read status and history

### 4. Database Management
- **SQLite**: Lightweight database
- **Article Storage**: Save generated news
- **Verification Records**: User verification data
- **Location Tracking**: User location history

## 🛠️ API Endpoints

### Backend API
- `POST /generate-article` - Generate article
- `POST /generate-article-stream` - Streaming article generation
- `GET /articles` - Get all articles
- `POST /articles/{id}/verify` - Verify article
- `GET /health` - Server health check

### WebSocket API
- `WS /ws/{user_id}` - Real-time connection
- `POST /users/{user_id}/location` - Update location
- `GET /users/nearby` - Find nearby users
- `GET /notifications/{user_id}` - Get notifications

## 🔧 Environment Configuration

### Environment Variables
```bash
# Create .env file
WEBSOCKET_ENABLED=true
NOTIFICATION_RADIUS_KM=1.0
MODEL_DEVICE=cpu  # or gpu
```

### ngrok Configuration
```bash
# Install ngrok
npm install -g ngrok

# Authenticate ngrok (optional)
ngrok authtoken YOUR_TOKEN
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Python Dependency Errors
```bash
# Recreate virtual environment
rm -rf gemma-venv
python3 -m venv gemma-venv
source gemma-venv/bin/activate
pip install -r requirements.txt
```

#### 2. Node.js Dependency Errors
```bash
cd frontend/truthsync
rm -rf node_modules package-lock.json
npm install
```

#### 3. ngrok Connection Errors
```bash
# Check ngrok processes
ps aux | grep ngrok

# Restart ngrok
pkill ngrok
ngrok start --all
```

#### 4. Port Conflicts
```bash
# Check used ports
lsof -i :8000  # Backend
lsof -i :4200  # Frontend
lsof -i :4040  # ngrok
```

### Log Checking
```bash
# Backend logs
tail -f ngrok_backend.log

# Frontend logs
tail -f ngrok_frontend.log

# ngrok logs
tail -f ngrok_proxy.log
```

## 📊 Performance Optimization

### Memory Usage
- **Backend**: ~4GB RAM
- **Frontend**: ~500MB RAM
- **Total Usage**: ~5GB RAM

### GPU Usage (Optional)
```bash
# Install GPU version
./install_dependencies_gpu.sh

# Check GPU availability
python -c "import torch; print(torch.cuda.is_available())"
```

## 🔒 Security Considerations

### Data Protection
- **Location Data**: Local storage, no encryption
- **Image Data**: Temporary storage, auto-deletion
- **User Data**: SQLite local storage

### Network Security
- **ngrok**: HTTPS tunneling
- **CORS**: Frontend domain allowance
- **WebSocket**: Real-time secure connection

## 🤝 Contributing

### Development Environment Setup
```bash
# Fork repository
git clone https://github.com/your-username/gemma-3n-truthsync.git

# Create branch
git checkout -b feature/your-feature

# Commit changes
git add .
git commit -m "Add your feature"

# Create Pull Request
```

### Code Style
- **Python**: PEP 8
- **TypeScript**: ESLint
- **HTML/CSS**: Prettier

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Google**: Gemma-3n model
- **Hugging Face**: Transformers library
- **FastAPI**: Backend framework
- **Angular**: Frontend framework

## 📞 Support

For issues or questions:
- **Issues**: GitHub Issues page
- **Email**: your-email@example.com
- **Documentation**: [INSTALLATION.md](./INSTALLATION.md)

---

**TruthSync** - Building the future of authentic journalism. 🚀 