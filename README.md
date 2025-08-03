# TruthSync - AI-Powered Real-time Journalism System

TruthSync is an innovative real-time journalism platform that leverages Google's Gemma-3n AI model to create authentic, location-based news articles. The system addresses the growing concern of fake news by implementing a controlled AI environment with location-based verification from eyewitnesses within a 1km radius.

## 🎯 Project Goals

### Combatting Fake News
- **AI-powered News Generation**: Accurate article creation using Gemma-3n model
- **Location-based Verification**: Real-time verification from eyewitnesses within 1km radius
- **Transparent AI**: Controlled platform for AI journalism

### Technical Innovation
- **Real-time Streaming**: Progressive text generation with TextStreamer
- **Location-based Notifications**: Real-time verification requests via WebSocket
- **Mobile Optimization**: Responsive design with touch-friendly interface
- **Image Processing**: Advanced image preprocessing with EXIF orientation correction
- **Database Persistence**: SQLite-based article and verification storage

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-username/gemma-3n-truthsync.git
cd gemma-3n-truthsync/gemma-3n-product
```

### 2. Auto Install and Run
```bash
chmod +x install_dependencies.sh
./install_dependencies.sh

chmod +x deploy-gemma3n-product.sh
./deploy-gemma3n-product.sh
```

### 3. Access via Browser
Access the application using the URL provided after script execution.

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

## 🔍 Key Features

### 1. AI-powered News Generation
- **Model**: Google Gemma-3n-E4B-it
- **Input**: Image + description
- **Output**: Structured news articles
- **Streaming**: Real-time text generation
- **Image Processing**: EXIF orientation correction, landscape rotation
- **Memory Optimization**: Direct memory processing without disk I/O

### 2. Location-based Verification System
- **GPS Tracking**: Real-time location updates
- **Radius Search**: Find users within 1km
- **WebSocket**: Real-time notification delivery
- **Verification Requests**: Send review requests to nearby users
- **Reverse Geocoding**: Address resolution from coordinates

### 3. Real-time Notification System
- **WebSocket Connection**: Real-time communication
- **Browser Notifications**: User notifications
- **Notification Badge**: Unread notification counter
- **Notification Management**: Read status and history
- **Auto-reconnection**: Automatic WebSocket reconnection

### 4. Advanced Image Processing
- **EXIF Orientation**: Automatic image rotation correction
- **Landscape Rotation**: 90-degree rotation for landscape photos
- **Quality Optimization**: JPEG compression with 85% quality
- **Size Limitation**: Max 1920x1080 with aspect ratio preservation
- **Memory Processing**: Direct processing without temporary files

### 5. Database Management
- **SQLite**: Lightweight database with three main tables
- **Article Storage**: Complete article data with metadata
- **Verification Records**: User verification data with confidence scores
- **Location Tracking**: User location history
- **CRUD Operations**: Full create, read, update, delete support

## 🏗️ Project Structure

```
gemma-3n-truthsync/
├── gemma-3n-product/           # Main application
│   ├── gemma3n_backend.py      # FastAPI backend (842 lines)
│   ├── frontend/truthsync/     # Angular frontend
│   │   ├── src/app/
│   │   │   ├── screens/        # Screen components
│   │   │   │   ├── camera/     # Camera capture and AI analysis
│   │   │   │   ├── home/       # Home screen with articles
│   │   │   │   ├── evaluation/ # Article evaluation system
│   │   │   │   ├── document-editor/ # Document creation
│   │   │   │   ├── post-detail/ # Article detail view
│   │   │   │   └── login/      # Authentication
│   │   │   ├── services/       # Core services
│   │   │   │   ├── ai.service.ts      # AI analysis (349 lines)
│   │   │   │   ├── notification.service.ts # WebSocket notifications (319 lines)
│   │   │   │   ├── location.service.ts # GPS and geocoding (342 lines)
│   │   │   │   ├── orientation.service.ts # Device orientation (117 lines)
│   │   │   │   ├── post.service.ts     # Article management (220 lines)
│   │   │   │   ├── evaluation.service.ts # Evaluation system (234 lines)
│   │   │   │   ├── camera.service.ts   # Camera operations (178 lines)
│   │   │   │   └── user.service.ts     # User management (26 lines)
│   │   │   ├── shared/         # Shared components
│   │   │   │   ├── notification-badge/ # Notification UI
│   │   │   │   └── bottom-nav/        # Navigation
│   │   │   └── environments/   # Environment configuration
│   │   └── package.json        # Frontend dependencies
│   ├── install_dependencies.sh  # CPU installation script (101 lines)
│   ├── install_dependencies_gpu.sh # GPU installation script (144 lines)
│   ├── deploy-gemma3n-product.sh # Full deployment script (413 lines)
│   ├── start-frontend-only.sh   # Frontend-only script (234 lines)
│   ├── start_backend.sh         # Backend start script (43 lines)
│   ├── requirements.txt         # Python dependencies (85 packages)
│   ├── requirements-gpu.txt     # GPU dependencies (80 packages)
│   ├── INSTALLATION.md          # Detailed installation guide (259 lines)
│   └── README.md               # Detailed installation guide (315 lines)
├── README.md                   # This file
└── .gitignore                  # Git ignore file
```

## 🛠️ Detailed Installation Guide

For detailed installation and usage instructions, see [gemma-3n-product/README.md](./gemma-3n-product/README.md).

### Key Documents
- **[Detailed Installation Guide](./gemma-3n-product/README.md)**: Step-by-step installation
- **[INSTALLATION.md](./gemma-3n-product/INSTALLATION.md)**: Advanced installation options
- **[Troubleshooting](./gemma-3n-product/README.md#🚨-troubleshooting)**: Common issues and solutions

## 🔧 Technology Stack

### Backend (Python/FastAPI)
- **Framework**: FastAPI 0.104.1 with uvicorn
- **AI Model**: Google Gemma-3n-E4B-it via transformers 4.53.0
- **Image Processing**: Pillow 10.0.1, OpenCV 4.8.1.78
- **Database**: SQLite with custom schema (articles, verifications, users)
- **Real-time Communication**: WebSocket support
- **HTTP Client**: httpx 0.25.2, requests 2.31.0
- **Data Processing**: numpy 1.24.3, pandas 2.0.3
- **Security**: python-jose, passlib, bcrypt
- **Development**: pytest, black, flake8, mypy

### Frontend (Angular/TypeScript)
- **Framework**: Angular 17+ with standalone components
- **Language**: TypeScript with strict typing
- **UI Framework**: Angular Material Design
- **Styling**: Tailwind CSS with custom SCSS
- **State Management**: RxJS BehaviorSubject and Observable
- **HTTP Client**: Angular HttpClient with interceptors
- **Real-time**: WebSocket API for notifications
- **Build Tool**: Vite with custom configuration
- **Development**: ESLint, Prettier

### Deployment & Infrastructure
- **Tunneling**: ngrok for external access
- **HTTP Server**: Static file serving
- **Process Management**: Shell scripts with error handling
- **Environment**: Virtual environments (Python), node_modules (Node.js)
- **Configuration**: Environment-specific settings
- **Logging**: Structured logging with rich output

## 🚨 Troubleshooting

### Common Issues

#### 1. Dependency Installation Errors
```bash
cd gemma-3n-product
rm -rf gemma-venv
./install_dependencies.sh
```

#### 2. Port Conflicts
```bash
# Check used ports
lsof -i :8000  # Backend
lsof -i :4200  # Frontend
```

#### 3. ngrok Connection Errors
```bash
# Restart ngrok
pkill ngrok
ngrok start --all
```

#### 4. Memory Issues
```bash
# Check memory usage
top -o mem
# Or on macOS
ps aux | sort -k 4 -r | head -10
```

## 📊 Performance Optimization

### Memory Usage
- **Backend**: ~4GB RAM (Gemma-3n model loading)
- **Frontend**: ~500MB RAM
- **Total Usage**: ~5GB RAM

### GPU Usage (Optional)
```bash
cd gemma-3n-product
./install_dependencies_gpu.sh
```

### Image Processing Optimization
- **Direct Memory Processing**: No temporary files
- **EXIF Correction**: Automatic orientation fix
- **Quality Optimization**: 85% JPEG compression
- **Size Limitation**: Max 1920x1080 with aspect ratio

## 🔒 Security Considerations

### Data Protection
- **Location Data**: Local storage, no encryption
- **Image Data**: Temporary storage, auto-deletion
- **User Data**: SQLite local storage
- **API Security**: CORS configuration, input validation

### Network Security
- **ngrok**: HTTPS tunneling
- **CORS**: Frontend domain allowance
- **WebSocket**: Real-time secure connection
- **File Upload**: Size and type validation

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
- **Python**: PEP 8, black, flake8, mypy
- **TypeScript**: ESLint, Prettier
- **HTML/CSS**: Prettier, Tailwind CSS

### Testing
```bash
# Backend tests
cd gemma-3n-product
source gemma-venv/bin/activate
pytest

# Frontend tests
cd frontend/truthsync
npm test
```

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Google**: Gemma-3n model
- **Hugging Face**: Transformers library
- **FastAPI**: Backend framework
- **Angular**: Frontend framework
- **Tailwind CSS**: Styling framework
- **ngrok**: Tunneling service

## 📞 Support

For issues or questions:
- **Issues**: GitHub Issues page
- **Email**: your-email@example.com
- **Documentation**: [gemma-3n-product/README.md](./gemma-3n-product/README.md)

---

**TruthSync** - Building the future of authentic journalism. 🚀 