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

## 🏗️ Project Structure

```
gemma-3n-truthsync/
├── gemma-3n-product/           # Main application
│   ├── gemma3n_backend.py      # FastAPI backend
│   ├── frontend/truthsync/     # Angular frontend
│   ├── install_dependencies.sh  # Installation script
│   ├── deploy-gemma3n-product.sh # Deployment script
│   └── README.md               # Detailed installation guide
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

### Backend
- **Python**: FastAPI, uvicorn
- **AI**: Google Gemma-3n-E4B-it
- **Database**: SQLite
- **Real-time Communication**: WebSocket

### Frontend
- **Angular**: 17+
- **TypeScript**: Type safety
- **Material Design**: Modern UI/UX
- **Tailwind CSS**: Styling

### Deployment
- **ngrok**: External access tunneling
- **HTTP Server**: Static file serving
- **Automation Scripts**: One-click deployment

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

## 📊 Performance Optimization

### Memory Usage
- **Backend**: ~4GB RAM
- **Frontend**: ~500MB RAM
- **Total Usage**: ~5GB RAM

### GPU Usage (Optional)
```bash
cd gemma-3n-product
./install_dependencies_gpu.sh
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
- **Documentation**: [gemma-3n-product/README.md](./gemma-3n-product/README.md)

---

**TruthSync** - Building the future of authentic journalism. 🚀 