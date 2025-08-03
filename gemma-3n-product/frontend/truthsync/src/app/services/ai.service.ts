import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface AIAnalysisResult {
  text: string;
  progress: number;
  status: 'loading' | 'processing' | 'completed' | 'error';
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private isModelLoaded = false;
  private isLoading = false;
  private apiUrl: string;

  constructor() {
    this.apiUrl = environment.apiUrl || 'http://localhost:8000';
    this.initializeModel();
  }

  async initializeModel() {
    if (this.isLoading || this.isModelLoaded) {
      console.log('모델 초기화 스킵:', { isLoading: this.isLoading, isModelLoaded: this.isModelLoaded });
      return;
    }
    
    try {
      this.isLoading = true;
      console.log('백엔드 Gemma-3n 모델 연결 확인 중...');
      
      // 백엔드 서버 상태 확인
      const response = await fetch(`${this.apiUrl}/health`);
      if (response.ok) {
        const healthData = await response.json();
        console.log('백엔드 서버 상태:', healthData);
        
        if (healthData.model_loaded) {
          this.isModelLoaded = true;
          this.isLoading = false;
          console.log('백엔드 Gemma-3n 모델 연결 완료');
        } else {
          throw new Error('백엔드 모델이 로드되지 않았습니다');
        }
      } else {
        throw new Error('백엔드 서버에 연결할 수 없습니다');
      }
      
    } catch (error) {
      console.error('백엔드 연결 실패:', error);
      this.isLoading = false;
      
      // 실패 시 시뮬레이션 모드로 폴백
      console.log('시뮬레이션 모드로 폴백합니다...');
      await this.simulateModelLoading();
      this.isModelLoaded = true;
      this.isLoading = false;
    }
  }

  private async simulateModelLoading(): Promise<void> {
    // 폴백용 시뮬레이션
    return new Promise((resolve) => {
      console.log('모델 로딩 시뮬레이션 시작...');
      
      // 단계별 로딩 시뮬레이션
      setTimeout(() => {
        console.log('백엔드 서버 연결 중...');
      }, 500);
      
      setTimeout(() => {
        console.log('Gemma-3n 모델 상태 확인 중...');
      }, 1500);
      
      setTimeout(() => {
        console.log('모델 로딩 시뮬레이션 완료');
        resolve();
      }, 3000);
    });
  }

  async analyzeImage(imageData: string, submessage: string = ''): Promise<AIAnalysisResult> {
    if (!this.isModelLoaded) {
      await this.initializeModel();
    }

    try {
      console.log('백엔드 Gemma-3n AI 분석 시작');
      
      // Base64 이미지를 Blob으로 변환
      const base64Data = imageData.split(',')[1];
      const blob = await this.base64ToBlob(base64Data, 'image/jpeg');
      
      // FormData 생성
      const formData = new FormData();
      formData.append('image', blob, 'captured_image.jpg');
      formData.append('submessage', submessage || '모바일 카메라로 촬영된 이미지입니다.');
      
      // 백엔드 API 호출
      const response = await fetch(`${this.apiUrl}/generate-article`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('백엔드 Gemma-3n 분석 결과:', data);
        
        return {
          text: data.article,
          progress: 100,
          status: 'completed'
        };
      } else {
        const errorText = await response.text();
        throw new Error(`백엔드 API 오류: ${response.status} ${errorText}`);
      }
      
    } catch (error) {
      console.error('백엔드 Gemma-3n AI 분석 실패:', error);
      return {
        text: '',
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  async analyzeImageStreaming(
    imageData: string, 
    submessage: string = '',
    onProgress?: (result: AIAnalysisResult) => void
  ): Promise<AIAnalysisResult> {
    if (!this.isModelLoaded) {
      await this.initializeModel();
    }

    try {
      console.log('백엔드 Gemma-3n 스트리밍 AI 분석 시작');
      
      // 진행 상태 업데이트
      onProgress?.({
        text: '',
        progress: 10,
        status: 'processing'
      });
      
      // Base64 이미지를 Blob으로 변환
      const base64Data = imageData.split(',')[1];
      const blob = await this.base64ToBlob(base64Data, 'image/jpeg');
      
      onProgress?.({
        text: '',
        progress: 30,
        status: 'processing'
      });
      
      // FormData 생성
      const formData = new FormData();
      formData.append('image', blob, 'captured_image.jpg');
      formData.append('submessage', submessage || '모바일 카메라로 촬영된 이미지입니다.');
      
      onProgress?.({
        text: '',
        progress: 50,
        status: 'processing'
      });
      
      // 백엔드 스트리밍 API 호출
      const response = await fetch(`${this.apiUrl}/generate-article-stream`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`백엔드 스트리밍 API 오류: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('스트리밍 응답을 읽을 수 없습니다');
      }
      
      let generatedText = '';
      let progress = 50;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('스트리밍 완료 (done = true)');
            break;
          }
          
          const chunk = new TextDecoder().decode(value);
          console.log('원본 청크 수신:', chunk);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log('스트리밍 데이터 수신:', data);
                
                if (data.text) {
                  generatedText += data.text;
                  progress = Math.min(90, 50 + (generatedText.length / 20));
                  
                  console.log('텍스트 업데이트:', { generatedText: generatedText.length, progress });
                  
                  onProgress?.({
                    text: generatedText,
                    progress,
                    status: 'processing'
                  });
                }
                
                if (data.status === 'completed') {
                  console.log('완료 신호 수신:', data);
                  // 완료 상태를 onProgress로 전달
                  onProgress?.({
                    text: generatedText,
                    progress: 100,
                    status: 'completed'
                  });
                  
                  return {
                    text: generatedText,
                    progress: 100,
                    status: 'completed'
                  };
                }
                
                if (data.error) {
                  console.error('스트리밍 오류:', data.error);
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.warn('JSON 파싱 오류:', parseError, '원본 라인:', line);
              }
            }
          }
        }
        
        // 스트리밍이 완료되었지만 완료 신호를 받지 못한 경우
        console.log('스트리밍 종료, 최종 텍스트 길이:', generatedText.length);
        if (generatedText.length > 0) {
          onProgress?.({
            text: generatedText,
            progress: 100,
            status: 'completed'
          });
          
          return {
            text: generatedText,
            progress: 100,
            status: 'completed'
          };
        }
      } finally {
        reader.releaseLock();
      }
      
      return {
        text: generatedText,
        progress: 100,
        status: 'completed'
      };
      
    } catch (error) {
      console.error('백엔드 Gemma-3n 스트리밍 AI 분석 실패:', error);
      return {
        text: '',
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      };
    }
  }

  private async base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  private async preprocessImage(blob: Blob): Promise<any> {
    // 이미지 리사이즈 및 전처리
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // 이미지 크기 제한 (메모리 최적화)
        const maxSize = 1024;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Canvas를 Blob으로 변환
        canvas.toBlob((processedBlob) => {
          if (processedBlob) {
            resolve(processedBlob);
          } else {
            reject(new Error('이미지 전처리 실패'));
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(blob);
    });
  }

  isModelReady(): boolean {
    return this.isModelLoaded;
  }

  getModelStatus(): { loaded: boolean; loading: boolean } {
    return {
      loaded: this.isModelLoaded,
      loading: this.isLoading
    };
  }
} 