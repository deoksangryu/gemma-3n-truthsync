import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AIService, AIAnalysisResult } from '../../services/ai.service';
import { LocationService, LocationInfo } from '../../services/location.service';
import { PostService, Post } from '../../services/post.service';
import { EvaluationService } from '../../services/evaluation.service';
import { OrientationService, OrientationInfo } from '../../services/orientation.service';

// 카메라 관련 타입 확장
interface ExtendedMediaTrackConstraints extends MediaTrackConstraints {
  facingMode?: string;
  torch?: boolean;
}

interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

interface ExtendedMediaTrackSettings extends MediaTrackSettings {
  torch?: boolean;
}

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './camera.component.html',
  styleUrl: './camera.component.scss'
})
export class CameraComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('video', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: true }) canvasElement!: ElementRef<HTMLCanvasElement>;

  isCapturing = false;
  isCameraActive = false;
  capturedImage: string | null = null;
  stream: MediaStream | null = null;
  errorMessage = '';
  currentFacingMode = 'environment'; // 기본값은 후면 카메라
  isMobile = false;
  isOnline = navigator.onLine;
  retryCount = 0;
  maxRetries = 3;
  permissionObserver: any = null;
  apiUrl: string;
  analysisProgress = 0;
  analysisMessage = '';
  
  // 스트리밍 관련 변수들
  isStreaming = false;
  streamedText = '';
  finalArticle = '';
  streamController: AbortController | null = null;
  userSubmessage = ''; // 사용자 부연설명
  
  // AI 모델 상태
  isModelReady = false;
  isModelLoading = false;
  
  // 위치 정보
  currentLocation: LocationInfo | null = null;
  locationString: string = '';
  
  // 중복 저장 방지 플래그
  isCreatingDocument = false;
  
  // 방향 정보
  currentOrientation: OrientationInfo | null = null;
  orientationSubscription: any = null;

  constructor(
    private router: Router, 
    public aiService: AIService,
    private locationService: LocationService,
    private postService: PostService,
    private evaluationService: EvaluationService,
    private orientationService: OrientationService
  ) {
    // 모바일 기기 감지
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // API URL 설정 (환경 설정에서 가져오거나 기본값 사용)
    this.apiUrl = environment.apiUrl || 'http://localhost:8000';
    console.log('카메라 컴포넌트 초기화 - API URL:', this.apiUrl);
    
    // 온라인 상태 모니터링
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
    
    // AI 모델 상태 모니터링
    this.monitorModelStatus();
  }

  private monitorModelStatus() {
    const checkStatus = () => {
      const status = this.aiService.getModelStatus();
      this.isModelReady = status.loaded;
      this.isModelLoading = status.loading;
      
      console.log('모델 상태 체크:', { loaded: status.loaded, loading: status.loading });
      
      // 모델이 로드되지 않았으면 계속 체크
      if (!status.loaded) {
        setTimeout(checkStatus, 1000);
      } else {
        console.log('모델 로딩 완료!');
      }
    };
    
    checkStatus();
  }

  ngOnInit() {
    console.log('카메라 컴포넌트 초기화');
    
    // 위치 정보 초기화
    this.initializeLocation();
    
    // 방향 감지 초기화
    this.initializeOrientationDetection();
    
    // 카메라 권한 확인 및 초기화
    this.checkPermissionAndInitialize();
  }

  ngAfterViewInit() {
    // 뷰 초기화 후 카메라 설정
    this.initializeCamera();
  }

  ngOnDestroy() {
    console.log('카메라 컴포넌트 정리');
    
    // 카메라 정지
    this.stopCamera();
    
    // 스트리밍 정지
    this.stopStreaming();
    
    // 위치 감시 중지
    this.locationService.stopLocationWatching();
    
    // 방향 감지 구독 해제
    if (this.orientationSubscription) {
      this.orientationSubscription.unsubscribe();
    }
  }

  // 방향 감지 초기화
  private initializeOrientationDetection(): void {
    // 현재 방향 정보 가져오기
    this.currentOrientation = this.orientationService.getCurrentOrientation();
    
    // 방향 변경 구독
    this.orientationSubscription = this.orientationService.orientation$.subscribe(
      (orientation) => {
        this.currentOrientation = orientation;
        console.log('카메라 방향 변경:', orientation);
      }
    );
  }

  async initializeLocation() {
    try {
      // 위치 권한 요청
      const hasPermission = await this.locationService.requestLocationPermission();
      
      if (hasPermission) {
        // 현재 위치 가져오기
        this.currentLocation = await this.locationService.getCurrentLocation();
        this.locationString = this.locationService.getFullAddress();
        console.log('카메라 컴포넌트 위치 초기화 완료:', this.locationString);
      } else {
        console.warn('위치 권한이 거부되었습니다.');
        this.locationString = '위치 정보 없음';
      }
      
    } catch (error) {
      console.error('위치 초기화 실패:', error);
      this.locationString = '위치 확인 실패';
    }
  }

  async requestCameraPermission() {
    try {
      // 권한 상태 확인
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        
        if (permission.state === 'denied') {
          this.errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.';
          return;
        }
        
        // 권한 상태 변경 모니터링 - 실시간으로 권한 변경 감지
        this.permissionObserver = new MutationObserver(() => {
          this.checkPermissionAndInitialize();
        });
        
        // 권한 변경 이벤트 리스너
        permission.onchange = () => {
          if (permission.state === 'granted') {
            console.log('카메라 권한이 허용되었습니다. 즉시 카메라를 초기화합니다.');
            this.initializeCamera();
          }
        };
      }
    } catch (error) {
      console.log('권한 API를 사용할 수 없습니다.');
    }
  }

  async checkPermissionAndInitialize() {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permission.state === 'granted' && !this.isCameraActive) {
          console.log('권한이 허용되어 카메라를 초기화합니다.');
          this.initializeCamera();
        }
      }
    } catch (error) {
      console.log('권한 확인 중 오류:', error);
    }
  }

  async initializeCamera() {
    try {
      this.errorMessage = '';
      this.isCameraActive = false;
      this.retryCount = 0;

      // 기존 스트림 정리
      this.stopCamera();

      // 모바일 최적화된 카메라 설정
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: this.currentFacingMode as any,
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          aspectRatio: { ideal: 16/9 },
          // 모바일에서 더 나은 성능을 위한 설정
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      };

      // 사용 가능한 카메라 확인
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('사용 가능한 카메라가 없습니다.');
      }

      // 모바일에서 후면 카메라 우선 시도
      if (this.isMobile && this.currentFacingMode === 'environment') {
        try {
          this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
          console.log('후면 카메라 접근 실패, 전면 카메라로 시도');
          this.currentFacingMode = 'user';
          (constraints.video as ExtendedMediaTrackConstraints).facingMode = 'user';
          this.stream = await navigator.mediaDevices.getUserMedia(constraints);
        }
      } else {
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      // 비디오 요소 설정
      const video = this.videoElement.nativeElement;
      video.srcObject = this.stream;
      
      // 비디오 로드 완료 대기
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('비디오 로드 시간 초과'));
        }, 10000); // 10초 타임아웃

        video.onloadedmetadata = () => {
          clearTimeout(timeout);
          video.play().then(() => {
            this.isCameraActive = true;
            this.retryCount = 0; // 성공 시 재시도 카운트 리셋
            resolve();
          }).catch(reject);
        };
        video.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      });

    } catch (error) {
      console.error('카메라 초기화 오류:', error);
      
      // 재시도 로직
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`카메라 초기화 재시도 ${this.retryCount}/${this.maxRetries}`);
        setTimeout(() => {
          this.initializeCamera();
        }, 1000 * this.retryCount); // 점진적 지연
        return;
      }
      
      // 다양한 오류 상황에 대한 처리
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            this.errorMessage = '카메라 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.';
            break;
          case 'NotFoundError':
            this.errorMessage = '카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.';
            break;
          case 'NotReadableError':
            this.errorMessage = '카메라가 다른 앱에서 사용 중입니다. 다른 앱을 종료하고 다시 시도해주세요.';
            break;
          case 'OverconstrainedError':
            this.errorMessage = '카메라 설정이 지원되지 않습니다. 다른 카메라를 시도해주세요.';
            break;
          default:
            this.errorMessage = '카메라 초기화에 실패했습니다. 페이지를 새로고침하고 다시 시도해주세요.';
        }
      } else {
        this.errorMessage = '카메라를 사용할 수 없습니다.';
      }
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
      });
      this.stream = null;
    }
    this.isCameraActive = false;
  }

  async captureImage() {
    if (!this.isCameraActive || !this.videoElement.nativeElement.srcObject) {
      this.errorMessage = '카메라가 활성화되지 않았습니다.';
      return;
    }

    try {
      this.isCapturing = true;
      this.errorMessage = '';
      
      const video = this.videoElement.nativeElement;
      const canvas = this.canvasElement.nativeElement;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
      }

      // 비디오가 실제로 재생 중인지 확인
      if (video.readyState < 2) {
        throw new Error('비디오가 아직 로드되지 않았습니다.');
      }

      // 캔버스 크기를 비디오 크기에 맞춤
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // 비디오 프레임을 캔버스에 그리기
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 이미지 품질 조정 (모바일에서 파일 크기 최적화)
      const quality = this.isMobile ? 0.5 : 0.7; // 모바일에서는 더 낮은 품질 사용
      this.capturedImage = canvas.toDataURL('image/jpeg', quality);
      
      // 부연설명 입력을 위해 자동 분석 제거
      // 사용자가 "AI 분석" 버튼을 눌러야 분석 시작
      
    } catch (error) {
      console.error('이미지 캡처 오류:', error);
      this.errorMessage = '이미지 캡처에 실패했습니다. 다시 시도해주세요.';
    } finally {
      this.isCapturing = false;
    }
  }

  async analyzeImageStreaming() {
    if (!this.capturedImage) return;

    try {
      console.log('클라이언트 사이드 AI 스트리밍 분석 시작');
      
      // 스트리밍 상태 초기화
      this.isStreaming = true;
      this.streamedText = '';
      this.finalArticle = '';
      this.analysisProgress = 0;
      this.analysisMessage = 'AI 분석을 시작합니다...';
      
      // 사용자 부연설명 또는 기본 메시지
      const submessage = this.userSubmessage.trim() || '모바일 카메라로 촬영된 이미지입니다.';
      
      // 위치 정보 추가 (백엔드에서 파싱할 수 있는 형식)
      let locationInfo = '';
      if (this.currentLocation) {
        locationInfo = `촬영 위치: ${this.currentLocation.latitude},${this.currentLocation.longitude} (${this.currentLocation.district}, ${this.currentLocation.city})`;
      }
      
      // 방향 정보 추가
      let orientationInfo = '';
      if (this.currentOrientation) {
        orientationInfo = `촬영 방향: ${this.currentOrientation.type}`;
      }
      
      // 전체 submessage 구성
      let fullSubmessage = submessage;
      if (locationInfo) {
        fullSubmessage += ` ${locationInfo}`;
      }
      if (orientationInfo) {
        fullSubmessage += ` ${orientationInfo}`;
      }
      
      console.log('위치 및 방향 정보 포함된 부연설명:', fullSubmessage);
      
      // 클라이언트 사이드 AI 서비스 사용
      const result = await this.aiService.analyzeImageStreaming(
        this.capturedImage,
        fullSubmessage,
        (progressResult: AIAnalysisResult) => {
          // 진행 상태 업데이트
          this.analysisProgress = progressResult.progress;
          this.analysisMessage = this.getProgressMessage(progressResult.progress);
          
          if (progressResult.text) {
            this.streamedText = progressResult.text;
          }
          
          if (progressResult.status === 'completed') {
            this.finalArticle = progressResult.text;
            this.analysisProgress = 100;
            this.analysisMessage = 'AI 분석이 완료되었습니다.';
            this.isStreaming = false;
            
            // 결과를 로컬 스토리지에 저장
            localStorage.setItem('lastArticle', JSON.stringify({ 
              article: this.finalArticle 
            }));
            
            // 사용자가 완료된 텍스트를 충분히 볼 수 있도록 3초 지연
            setTimeout(() => {
              this.router.navigate(['/post-detail']);
            }, 3000);
          }
          
          if (progressResult.status === 'error') {
            this.errorMessage = progressResult.error || 'AI 분석에 실패했습니다.';
            this.isStreaming = false;
          }
        }
      );
      
      if (result.status === 'error') {
        this.errorMessage = result.error || 'AI 분석에 실패했습니다.';
        this.isStreaming = false;
      }
      
    } catch (error) {
      console.error('클라이언트 사이드 AI 분석 오류:', error);
      this.isStreaming = false;
      this.errorMessage = 'AI 분석에 실패했습니다.';
    }
  }

  private getProgressMessage(progress: number): string {
    if (progress < 20) return 'AI 모델을 로딩하고 있습니다...';
    if (progress < 40) return '이미지를 처리하고 있습니다...';
    if (progress < 60) return 'AI가 이미지를 분석하고 있습니다...';
    if (progress < 80) return '기사를 생성하고 있습니다...';
    return 'AI 분석이 완료되었습니다.';
  }

  stopStreaming() {
    if (this.streamController) {
      this.streamController.abort();
      this.streamController = null;
    }
    this.isStreaming = false;
  }

  async analyzeImage() {
    if (!this.capturedImage) return;

    // 오프라인 상태 확인
    if (!this.isOnline) {
      this.errorMessage = '인터넷 연결이 필요합니다. 네트워크를 확인해주세요.';
      return;
    }

    try {
      console.log('AI 분석 시작 - 이미지 크기:', this.capturedImage.length);
      
      // 이미지를 Blob으로 변환
      const response = await fetch(this.capturedImage);
      const blob = await response.blob();
      console.log('Blob 생성 완료 - 크기:', blob.size, '타입:', blob.type);
      
      // FormData 생성
      const formData = new FormData();
      formData.append('image', blob, 'captured_image.jpg');
      
      // 사용자 부연설명 또는 기본 메시지
      const submessage = this.userSubmessage.trim() || '모바일 카메라로 촬영된 이미지입니다.';
      
      // 위치 정보 추가 (백엔드에서 파싱할 수 있는 형식)
      let locationInfo = '';
      if (this.currentLocation) {
        locationInfo = `촬영 위치: ${this.currentLocation.latitude},${this.currentLocation.longitude} (${this.currentLocation.district}, ${this.currentLocation.city})`;
      }
      
      // 방향 정보 추가
      let orientationInfo = '';
      if (this.currentOrientation) {
        orientationInfo = `촬영 방향: ${this.currentOrientation.type}`;
      }
      
      // 전체 submessage 구성
      let fullSubmessage = submessage;
      if (locationInfo) {
        fullSubmessage += ` ${locationInfo}`;
      }
      if (orientationInfo) {
        fullSubmessage += ` ${orientationInfo}`;
      }
      
      formData.append('submessage', fullSubmessage);
      console.log('위치 및 방향 정보 포함된 부연설명:', fullSubmessage);
      console.log('FormData 생성 완료');
      
      // 백엔드 API 호출 - 환경 설정에서 가져온 URL 사용
      const apiUrl = `${this.apiUrl}/generate-article`;
      
      console.log('AI 분석 요청 시작:', apiUrl);
      console.log('API URL 설정:', this.apiUrl);
      
      // 서버 연결 테스트 - 더 정확한 확인
      let serverAvailable = false;
      try {
        console.log('서버 연결 테스트 시작:', `${this.apiUrl}/health`);
        const testResponse = await fetch(`${this.apiUrl}/health`, { 
          method: 'GET',
          mode: 'cors',
          signal: AbortSignal.timeout(10000) // 10초 타임아웃
        });
        console.log('서버 연결 테스트 응답:', testResponse.status, testResponse.statusText);
        
        if (testResponse.ok) {
          const healthData = await testResponse.json();
          console.log('서버 상태:', healthData);
          serverAvailable = true;
          console.log('서버 연결 테스트 성공');
        }
      } catch (testError) {
        console.error('서버 연결 테스트 실패:', testError);
        this.errorMessage = '백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
        return;
      }
      
      if (!serverAvailable) {
        this.errorMessage = '백엔드 서버가 응답하지 않습니다. 서버를 시작해주세요.';
        return;
      }
      
      console.log('AI 분석 API 호출 시작');
      
      // AI 분석 요청 - 더 긴 타임아웃 설정
      const result = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        mode: 'cors',
        signal: AbortSignal.timeout(600000) // 10분 타임아웃 (AI 분석에 충분한 시간)
      });
      
      console.log('AI 분석 응답 상태:', result.status, result.statusText);
      console.log('응답 헤더:', {
        'content-type': result.headers.get('content-type'),
        'content-length': result.headers.get('content-length')
      });
      
      if (result.ok) {
        const data = await result.json();
        console.log('AI 분석 결과:', data);
        
        if (data.article) {
          // 결과를 로컬 스토리지에 저장
          localStorage.setItem('lastArticle', JSON.stringify(data));
          
          // 결과 페이지로 이동
          this.router.navigate(['/post-detail']);
        } else if (data.request_id) {
          // 진행 상태 모니터링 시작
          this.updateAnalysisProgress(data.request_id);
        } else {
          throw new Error('AI 분석 결과가 비어있습니다.');
        }
      } else {
        const errorText = await result.text();
        console.error('API 오류 응답:', errorText);
        
        if (result.status === 404) {
          throw new Error('API 엔드포인트를 찾을 수 없습니다. 서버 설정을 확인해주세요.');
        } else if (result.status === 500) {
          throw new Error('서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else if (result.status === 413) {
          throw new Error('이미지 파일이 너무 큽니다. 더 작은 이미지로 시도해주세요.');
        } else if (result.status === 400) {
          throw new Error('잘못된 이미지 파일입니다. 다시 촬영해주세요.');
        } else {
          throw new Error(`API 호출 실패: ${result.status} ${result.statusText}`);
        }
      }
      
    } catch (error) {
      console.error('AI 분석 오류:', error);
      
      // 네트워크 오류인지 확인
      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.errorMessage = '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.';
      } else if (error instanceof Error && error.message.includes('API 엔드포인트를 찾을 수 없습니다')) {
        this.errorMessage = 'AI 분석 서비스가 설정되지 않았습니다. 서버를 재시작해주세요.';
      } else if (error instanceof Error && error.message.includes('서버 내부 오류')) {
        this.errorMessage = 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error instanceof Error && error.message.includes('이미지 파일이 너무 큽니다')) {
        this.errorMessage = '이미지 파일이 너무 큽니다. 더 작은 이미지로 다시 촬영해주세요.';
      } else if (error instanceof Error && error.message.includes('잘못된 이미지 파일')) {
        this.errorMessage = '잘못된 이미지 파일입니다. 다시 촬영해주세요.';
      } else if (error instanceof Error && error.message.includes('API 호출 실패')) {
        this.errorMessage = 'AI 분석 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error instanceof Error && error.name === 'AbortError') {
        this.errorMessage = 'AI 분석 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.';
      } else {
        this.errorMessage = 'AI 분석에 실패했습니다. 네트워크 연결을 확인해주세요.';
      }
    }
  }

  retakePhoto() {
    this.capturedImage = null;
    this.errorMessage = '';
    this.streamedText = '';
    this.finalArticle = '';
    this.isStreaming = false;
    this.userSubmessage = ''; // 부연설명 초기화
    this.stopStreaming();
  }

  async switchCamera() {
    // 카메라 전환 (전면/후면)
    this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
    
    // 현재 스트림 정리
    this.stopCamera();
    
    // 새로운 카메라로 초기화
    setTimeout(() => {
      this.initializeCamera();
    }, 100);
  }

  toggleFlash() {
    // 플래시 기능 (지원하는 기기에서만)
    if (this.stream) {
      const videoTrack = this.stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
        if (capabilities.torch) {
          const settings = videoTrack.getSettings() as ExtendedMediaTrackSettings;
          const newTorchValue = !settings.torch;
          
          videoTrack.applyConstraints({
            advanced: [{ torch: newTorchValue } as any]
          }).then(() => {
            console.log('플래시 토글:', newTorchValue);
          }).catch(error => {
            console.error('플래시 토글 실패:', error);
          });
        } else {
          console.log('이 기기는 플래시를 지원하지 않습니다.');
        }
      }
    }
  }

  // 카메라 재시작
  restartCamera() {
    this.retryCount = 0; // 재시도 카운트 리셋
    this.initializeCamera();
  }

  // 네트워크 상태 확인
  checkNetworkStatus() {
    return this.isOnline;
  }

  // AI 분석 진행 상태 업데이트
  async updateAnalysisProgress(requestId: string) {
    try {
      const response = await fetch(`${this.apiUrl}/analysis-status/${requestId}`);
      if (response.ok) {
        const status = await response.json();
        this.analysisProgress = status.progress || 0;
        this.analysisMessage = status.message || '';
        
        if (status.status === 'completed' && status.article) {
          // 결과를 로컬 스토리지에 저장
          localStorage.setItem('lastArticle', JSON.stringify({ article: status.article }));
          
          // 결과 페이지로 이동
          this.router.navigate(['/post-detail']);
          return;
        } else if (status.status === 'error') {
          this.errorMessage = status.message || 'AI 분석 중 오류가 발생했습니다.';
          this.isCapturing = false;
          return;
        }
        
        // 진행 중이면 2초 후 다시 확인
        if (status.status === 'processing') {
          setTimeout(() => this.updateAnalysisProgress(requestId), 2000);
        }
      }
    } catch (error) {
      console.error('진행 상태 확인 오류:', error);
    }
  }

  // 문서 생성 기능
  async createDocument() {
    if (!this.capturedImage || !this.finalArticle) {
      this.errorMessage = '이미지와 분석 결과가 필요합니다.';
      return;
    }

    // 중복 저장 방지
    if (this.isCreatingDocument) {
      console.log('문서 생성이 이미 진행 중입니다.');
      return;
    }

    try {
      this.isCreatingDocument = true;
      console.log('=== 문서 생성 시작 ===');
      console.log('이미지 크기:', this.capturedImage.length);
      console.log('분석 결과 길이:', this.finalArticle.length);
      console.log('부연설명:', this.userSubmessage);
      
      // 새 기사 생성
      console.log('Post 서비스로 기사 생성 중...');
      const newPost = await this.postService.createPost(
        this.capturedImage,
        this.finalArticle,
        this.userSubmessage,
        this.extractHeadline(this.finalArticle)
      );
      
      console.log('기사 생성 완료:', newPost);
      
      // 평가 요청 생성
      console.log('평가 요청 생성 시작...');
      const evaluationRequest = await this.evaluationService.createEvaluationRequest(newPost);
      
      // 주변 사용자에게 평가 요청 전송
      console.log('주변 사용자에게 평가 요청 전송 중...');
      await this.evaluationService.sendEvaluationToNearbyUsers(evaluationRequest);
      
      console.log('평가 요청 전송 완료');
      console.log('=== 문서 생성 완료 ===');
      
      // 성공 메시지 표시
      this.errorMessage = '';
      
      // 홈 화면으로 이동
      console.log('홈 화면으로 이동 중...');
      this.router.navigate(['/home']);
      
    } catch (error) {
      console.error('문서 생성 오류:', error);
      this.errorMessage = '문서 생성에 실패했습니다.';
    } finally {
      this.isCreatingDocument = false;
    }
  }

  // 내용에서 제목 추출
  private extractHeadline(content: string): string {
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    
    if (firstLine.length > 0) {
      // 제목이 너무 길면 자르기
      return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    }
    
    return '새로운 기사';
  }

  // 재분석 기능
  reanalyzeImage() {
    if (!this.capturedImage) {
      this.errorMessage = '재분석할 이미지가 없습니다.';
      return;
    }

    // 재분석을 위해 상태 초기화
    this.finalArticle = '';
    this.streamedText = '';
    this.analysisProgress = 0;
    this.analysisMessage = '';
    
    // 부연설명 입력 영역이 다시 나타나도록 함
    // (HTML에서 *ngIf="!isStreaming && !finalArticle" 조건으로 자동 처리됨)
    
    console.log('재분석 준비 완료');
  }

  // 결과 페이지로 이동
  goToPostDetail() {
    if (!this.finalArticle) {
      this.errorMessage = '분석 결과가 없습니다.';
      return;
    }

    // 결과를 로컬 스토리지에 저장
    localStorage.setItem('lastArticle', JSON.stringify({ 
      article: this.finalArticle 
    }));
    
    // 결과 페이지로 이동
    this.router.navigate(['/post-detail']);
  }

  // 홈으로 돌아가기
  goToHome() {
    console.log('홈으로 돌아가기');
    this.router.navigate(['/home']);
  }
}
