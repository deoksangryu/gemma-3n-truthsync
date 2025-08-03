import { Injectable } from '@angular/core';

export interface CameraSettings {
  facingMode: 'user' | 'environment';
  width: number;
  height: number;
  flash?: boolean;
}

export interface AnalysisResult {
  article: string;
  confidence?: number;
  processingTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private stream: MediaStream | null = null;

  constructor() {}

  async initializeCamera(settings: CameraSettings = {
    facingMode: 'environment',
    width: 1920,
    height: 1080
  }): Promise<MediaStream> {
    try {
      const constraints = {
        video: {
          facingMode: settings.facingMode,
          width: { ideal: settings.width },
          height: { ideal: settings.height }
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.stream;
    } catch (error) {
      console.error('카메라 초기화 오류:', error);
      throw new Error('카메라에 접근할 수 없습니다.');
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  async captureImage(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement): Promise<string> {
    const context = canvasElement.getContext('2d');
    if (!context) {
      throw new Error('캔버스 컨텍스트를 가져올 수 없습니다.');
    }

    // 캔버스 크기를 비디오 크기에 맞춤
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    
    // 비디오 프레임을 캔버스에 그리기
    context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    // 캔버스를 이미지로 변환 (품질 0.8)
    return canvasElement.toDataURL('image/jpeg', 0.8);
  }

  async analyzeImage(imageDataUrl: string, submessage: string = ''): Promise<AnalysisResult> {
    try {
      // 이미지를 Blob으로 변환
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // FormData 생성
      const formData = new FormData();
      formData.append('image', blob, 'captured_image.jpg');
      formData.append('submessage', submessage);
      
      // 백엔드 API 호출
      const apiUrl = 'http://localhost:8000/generate-article';
      const result = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!result.ok) {
        throw new Error(`API 오류: ${result.status}`);
      }
      
      const data = await result.json();
      return {
        article: data.article,
        confidence: data.confidence,
        processingTime: data.processingTime
      };
      
    } catch (error) {
      console.error('AI 분석 오류:', error);
      throw new Error('AI 분석에 실패했습니다.');
    }
  }

  async switchCamera(): Promise<MediaStream> {
    this.stopCamera();
    
    // 현재 카메라가 후면이면 전면으로, 전면이면 후면으로
    const currentFacingMode = this.stream?.getVideoTracks()[0]?.getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    
    return this.initializeCamera({ facingMode: newFacingMode, width: 1920, height: 1080 });
  }

  async toggleFlash(): Promise<boolean> {
    if (!this.stream) return false;
    
    const videoTrack = this.stream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities() as any;
    
    if (!capabilities.torch) {
      console.warn('플래시를 지원하지 않는 기기입니다.');
      return false;
    }
    
    try {
      const currentSettings = videoTrack.getSettings() as any;
      const newTorchValue = !currentSettings.torch;
      
      await videoTrack.applyConstraints({
        advanced: [{ torch: newTorchValue }] as any
      });
      
      return newTorchValue;
    } catch (error) {
      console.error('플래시 토글 오류:', error);
      return false;
    }
  }

  getCameraCapabilities(): { hasFlash: boolean; hasMultipleCameras: boolean } {
    if (!this.stream) {
      return { hasFlash: false, hasMultipleCameras: false };
    }
    
    const videoTrack = this.stream.getVideoTracks()[0];
    const capabilities = videoTrack.getCapabilities() as any;
    
    return {
      hasFlash: !!capabilities.torch,
      hasMultipleCameras: false // 기본값으로 설정, 필요시 async로 변경
    };
  }

  // 카메라 권한 확인
  async checkCameraPermission(): Promise<boolean> {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state === 'granted';
    } catch (error) {
      console.warn('권한 확인 실패:', error);
      return false;
    }
  }

  // 권한 요청
  async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('카메라 권한 요청 실패:', error);
      return false;
    }
  }
} 