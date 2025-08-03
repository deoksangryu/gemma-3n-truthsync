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
source gemma-3n/bin/activate

# Start backend
python gemma3n_backend.py
```

#### GPU Version (Optional)
```bash
# Install GPU dependencies
./install_dependencies_gpu.sh

# Activate virtual environment
source gemma-3n/bin/activate

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
- Handles all dependencies and setup

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
├── gemma3n_backend.py          # FastAPI backend server (842 lines)
├── requirements.txt             # Python dependencies (85 packages)
├── requirements-gpu.txt         # Python dependencies (80 packages)
├── install_dependencies.sh      # CPU dependency installation script (101 lines)
├── install_dependencies_gpu.sh  # GPU dependency installation script (144 lines)
├── deploy-gemma3n-product.sh   # Full deployment script (413 lines)
├── start_backend.sh            # Backend start script (43 lines)
├── start-frontend-only.sh      # Frontend start script (234 lines)
├── frontend/                   # Angular frontend
│   └── truthsync/
│       ├── src/
│       │   ├── app/
│       │   │   ├── screens/    # Screen components
│       │   │   │   ├── camera/     # Camera capture and AI analysis
│       │   │   │   ├── home/       # Home screen with articles
│       │   │   │   ├── evaluation/ # Article evaluation system
│       │   │   │   ├── document-editor/ # Document creation
│       │   │   │   ├── post-detail/ # Article detail view
│       │   │   │   └── login/      # Authentication
│       │   │   ├── services/       # Core services
│       │   │   │   ├── ai.service.ts      # AI analysis (349 lines)
│       │   │   │   ├── notification.service.ts # WebSocket notifications (319 lines)
│       │   │   │   ├── location.service.ts # GPS and geocoding (342 lines)
│       │   │   │   ├── orientation.service.ts # Device orientation (117 lines)
│       │   │   │   ├── post.service.ts     # Article management (220 lines)
│       │   │   │   ├── evaluation.service.ts # Evaluation system (234 lines)
│       │   │   │   ├── camera.service.ts   # Camera operations (178 lines)
│       │   │   │   └── user.service.ts     # User management (26 lines)
│       │   │   ├── shared/         # Shared components
│       │   │   │   ├── notification-badge/ # Notification UI
│       │   │   │   └── bottom-nav/        # Navigation
│       │   │   └── environments/   # Environment configuration
│       │   └── main.ts            # Application entry point
│       ├── package.json           # Frontend dependencies
│       ├── angular.json           # Angular configuration
│       ├── vite.config.ts         # Vite build configuration
│       └── tailwind.config.js     # Tailwind CSS configuration
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

## 🛠️ API Endpoints

### Backend API

#### Article Generation
- `POST /generate-article` - Generate article (non-streaming)
- `POST /generate-article-stream` - Streaming article generation
- `GET /analysis-status/{request_id}` - Check analysis status

#### Article Management
- `GET /articles` - Get all articles (with pagination)
- `GET /articles/{article_id}` - Get specific article
- `DELETE /articles/{article_id}` - Delete article

#### Verification System
- `POST /articles/{article_id}/verify` - Verify article
- `GET /articles/{article_id}/verifications` - Get article verifications

#### Health & Status
- `GET /` - Root endpoint
- `GET /health` - Server health check

### WebSocket API (Planned)
- `WS /ws/{user_id}` - Real-time connection
- `POST /users/{user_id}/location` - Update location
- `GET /users/nearby` - Find nearby users
- `GET /notifications/{user_id}` - Get notifications

### Database Schema

#### Articles Table
```sql
CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id TEXT UNIQUE NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    image_data BLOB,
    submessage TEXT,
    location TEXT,
    orientation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'published',
    verification_score REAL DEFAULT 0.0,
    verification_count INTEGER DEFAULT 0
);
```

#### Verifications Table
```sql
CREATE TABLE verifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    user_id TEXT,
    user_location TEXT,
    verification_type TEXT CHECK(verification_type IN ('truth', 'fake', 'unsure')),
    confidence_score REAL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles (id)
);
```

#### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    username TEXT,
    email TEXT,
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Environment Configuration

### Environment Variables
```bash
# Create .env file
WEBSOCKET_ENABLED=true
NOTIFICATION_RADIUS_KM=1.0
MODEL_DEVICE=cpu  # or gpu
ENVIRONMENT=development
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
CORS_ORIGINS=["*"]
MAX_FILE_SIZE=10485760
MODEL_NAME=google/gemma-3n-e4b-it
```

### ngrok Configuration
```bash
# Install ngrok
npm install -g ngrok

# Authenticate ngrok (optional)
ngrok authtoken YOUR_TOKEN
```

### Frontend Environment
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://your-ngrok-url.ngrok.app',
  wsUrl: 'wss://your-ngrok-url.ngrok.app',
  notificationSettings: {
    enableBrowserNotifications: true,
    enableSound: false,
    autoMarkAsRead: false
  }
};
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

#### 5. Memory Issues
```bash
# Check memory usage
top -o mem
# Or on macOS
ps aux | sort -k 4 -r | head -10
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
- **Backend**: ~4GB RAM (Gemma-3n model loading)
- **Frontend**: ~500MB RAM
- **Total Usage**: ~5GB RAM

### GPU Usage (Optional)
```bash
# Install GPU version
./install_dependencies_gpu.sh

# Check GPU availability
python -c "import torch; print(torch.cuda.is_available())"
```

### Image Processing Optimization
- **Direct Memory Processing**: No temporary files
- **EXIF Correction**: Automatic orientation fix
- **Quality Optimization**: 85% JPEG compression
- **Size Limitation**: Max 1920x1080 with aspect ratio

### Database Optimization
- **Indexing**: Primary keys and foreign keys
- **Connection Pooling**: SQLite connection management
- **Query Optimization**: Efficient CRUD operations

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

### Input Validation
- **File Type**: Image format validation
- **File Size**: 10MB maximum limit
- **SQL Injection**: Parameterized queries
- **XSS Protection**: Input sanitization

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
- **Documentation**: [INSTALLATION.md](./INSTALLATION.md)

---

**TruthSync** - Building the future of authentic journalism. 🚀 