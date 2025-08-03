# TruthSync: AI-Powered Real-Time Journalism System

## 📰 Overview

TruthSync is an innovative real-time journalism platform that leverages Google's Gemma-3n-E4B-it model to create authentic, location-based news articles. The system addresses the growing concern of fake news by implementing a controlled AI environment with location-based verification from eyewitnesses within a 1km radius.

## 🎯 Why Gemma-3n?

### Multimodal Capabilities
- **Image-to-Text Generation**: Instant news article creation from captured photos
- **Real-time Processing**: 32K token context for comprehensive article generation
- **Multilingual Support**: 140+ languages for global journalism

### Efficient Resource Management
- **Selective Parameter Activation**: 8B parameters run with 4B memory footprint
- **Low-resource Device Support**: Optimized for mobile environments
- **MatFormer Architecture**: Flexible nested sub-models for various use cases

### Journalism-Specific Features
- **Image Analysis**: Supports 256x256, 512x512, 768x768 resolutions
- **Text Generation**: Up to 32K token output for detailed articles
- **Real-time Streaming**: TextStreamer for enhanced user experience

## 🚀 System Architecture

### Frontend (Angular)
```
frontend/truthsync/
├── src/app/
│   ├── screens/
│   │   ├── camera/          # Photo capture and AI analysis
│   │   ├── home/            # Article feed display
│   │   ├── evaluation/      # Location-based verification
│   │   └── post-detail/     # Article detail view
│   ├── services/
│   │   ├── ai.service.ts    # AI model communication
│   │   ├── location.service.ts # GPS and geocoding
│   │   ├── orientation.service.ts # Device orientation detection
│   │   └── post.service.ts  # Article management
│   └── components/          # Reusable UI components
```

### Backend (FastAPI + Gemma-3n)
```
gemma3n_backend.py           # Main AI processing server
├── Image Processing         # EXIF handling, rotation, resizing
├── AI Model Integration    # Gemma-3n pipeline setup
├── Streaming Response      # Real-time text generation
└── Error Handling          # Comprehensive error management
```

## 🔧 Key Features

### 1. Intelligent Photo Capture
- **Real-time Camera Access**: Direct device camera integration
- **Location Metadata**: GPS coordinates and reverse geocoding
- **Orientation Detection**: Landscape/portrait mode awareness
- **Image Optimization**: Automatic rotation and quality adjustment

### 2. AI-Powered Article Generation
```python
# System prompt for controlled journalism
messages = [
    {
        "role": "system",
        "content": [
            {"type": "text", "text": "당신은 뉴스 기자 입니다. 이미지를 통해 상세히 기사를 작성해주세요."}
        ]
    }
]
```

### 3. Location-Based Verification
- **1km Radius Search**: Find nearby users for verification
- **Real-time Voting**: Instant truth verification system
- **Credibility Scoring**: Weighted verification results
- **Eyewitness Validation**: Same time, same place experience

### 4. Real-time Streaming UI
```typescript
// Progressive text display
const result = await this.aiService.analyzeImageStreaming(
  this.capturedImage,
  fullSubmessage,
  (progress) => {
    this.streamedText += progress;
    this.updateProgress();
  }
);
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- Angular CLI
- ngrok (for external access)

### Backend Setup
```bash
# Navigate to project directory
cd gemma-3n-product

# Create virtual environment
python -m venv gemma-venv
source gemma-venv/bin/activate  # On Windows: gemma-venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
./start_backend.sh
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend/truthsync

# Install dependencies
npm install

# Build for production
npm run build

# Start development server
npm start
```

### Full Stack Deployment
```bash
# Deploy entire system with ngrok
./start-app.sh

# Frontend-only deployment
./start-frontend-only.sh
```

## 📱 Usage Workflow

### 1. Photo Capture
1. Open TruthSync app
2. Navigate to camera screen
3. Capture photo with location and orientation data
4. Add optional description

### 2. AI Analysis
1. System processes image with metadata
2. Gemma-3n generates article in real-time
3. Progressive text display shows generation progress
4. User can stop generation at any time

### 3. Article Creation
1. Review generated article
2. Choose to apply to photo (create document)
3. Save to local storage and backend
4. Article appears in home feed

### 4. Location-Based Verification
1. Nearby users (within 1km) receive verification request
2. Users vote on article credibility
3. Real-time credibility score calculation
4. Results displayed to original author

## 🔍 Technical Innovations

### Image Processing Pipeline
```python
# Automatic image optimization
def process_image_with_metadata(image_data, location, orientation):
    # EXIF orientation handling
    # Landscape/portrait rotation
    # Quality optimization
    # Metadata encoding
    return processed_image_with_context
```

### Real-time Streaming
- **Server-Sent Events (SSE)**: Real-time text streaming
- **Progress Indicators**: Visual feedback during generation
- **Error Handling**: Graceful failure management
- **Memory Optimization**: Direct memory processing

### Location Services
```typescript
// GPS and geocoding integration
class LocationService {
  async getCurrentLocation(): Promise<LocationInfo>
  async getLocationInfo(): Promise<string>
  async startLocationWatching(): Promise<void>
  calculateDistance(lat1, lon1, lat2, lon2): number
}
```

## 🎨 UI/UX Design

### Modern Mobile-First Design
- **Material Design**: Angular Material components
- **Responsive Layout**: Optimized for all screen sizes
- **Dark/Light Themes**: User preference support
- **Accessibility**: WCAG 2.1 compliance

### Camera Interface
- **Real-time Preview**: Live camera feed
- **Location Display**: Current GPS coordinates
- **Orientation Indicator**: Landscape/portrait mode
- **Capture Controls**: Intuitive photo capture

### Article Feed
- **Card-based Layout**: Clean article presentation
- **Location Tags**: Geographic context
- **Verification Status**: Credibility indicators
- **Interactive Elements**: Like, share, verify actions

## 🔒 Security & Privacy

### Data Protection
- **Local Storage**: Sensitive data stored locally
- **Encrypted Transmission**: HTTPS for all communications
- **Privacy Controls**: User consent for location sharing
- **Data Minimization**: Only necessary data collection

### AI Safety
- **Controlled Prompts**: System-level safety guidelines
- **Content Filtering**: Harmful content detection
- **Bias Mitigation**: Diverse training data approach
- **Transparency**: Clear AI involvement disclosure

## 📊 Performance Metrics

### Processing Speed
- **Image Processing**: < 2 seconds
- **AI Generation**: 10-30 seconds depending on complexity
- **Location Services**: < 1 second response time
- **Verification**: Real-time updates

### Resource Usage
- **Memory**: Optimized for mobile devices
- **Battery**: Efficient GPS and camera usage
- **Network**: Minimal data transfer
- **Storage**: Compressed image storage

## 🌍 Global Impact

### Journalism Innovation
- **Democratization**: Anyone can be a journalist
- **Verification**: Crowdsourced truth checking
- **Transparency**: Open AI processes
- **Accessibility**: Multilingual support

### Social Impact
- **Fake News Combat**: Location-based verification
- **Community Engagement**: Local news focus
- **Digital Literacy**: AI journalism education
- **Press Freedom**: Decentralized news creation

## 🔮 Future Roadmap

### Phase 1: Core Features ✅
- [x] Photo capture and AI analysis
- [x] Real-time article generation
- [x] Location-based verification
- [x] Basic UI/UX implementation

### Phase 2: Enhanced Features 🚧
- [ ] Advanced verification algorithms
- [ ] Multi-language article generation
- [ ] Video content support
- [ ] Advanced analytics dashboard

### Phase 3: Platform Expansion 📋
- [ ] Web platform development
- [ ] API for third-party integrations
- [ ] Blockchain verification system
- [ ] Global community features

## 🤝 Contributing

### Development Guidelines
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- **Python**: PEP 8 compliance
- **TypeScript**: ESLint configuration
- **Angular**: Style guide adherence
- **Documentation**: Comprehensive docstrings

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google DeepMind**: For the Gemma-3n model
- **Hugging Face**: For model hosting and distribution
- **Angular Team**: For the excellent frontend framework
- **FastAPI**: For the high-performance backend framework

## 📞 Contact

- **Project Link**: [https://github.com/your-username/truthsync](https://github.com/your-username/truthsync)
- **Issues**: [https://github.com/your-username/truthsync/issues](https://github.com/your-username/truthsync/issues)
- **Documentation**: [https://truthsync-docs.readthedocs.io](https://truthsync-docs.readthedocs.io)

---

**TruthSync**: Where AI meets human verification for authentic journalism. 🌟 