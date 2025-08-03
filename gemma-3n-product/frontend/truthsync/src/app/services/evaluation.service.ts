import { Injectable } from '@angular/core';
import { LocationService, LocationInfo } from './location.service';
import { Post } from './post.service';

export interface Evaluation {
  id: number;
  postId: number;
  evaluatorId: string;
  evaluatorLocation: LocationInfo;
  distance: number; // 평가자와 기사 작성자의 거리
  quality: number; // 품질 점수 (1-5)
  publishable: boolean; // 게시 가능 여부
  comment?: string; // 평가 코멘트
  timestamp: Date;
}

export interface EvaluationRequest {
  postId: number;
  postLocation: LocationInfo;
  radius: number; // 검증 반경 (1km)
  maxEvaluators: number; // 최대 평가자 수
  timeout: number; // 평가 대기 시간 (분)
}

@Injectable({
  providedIn: 'root'
})
export class EvaluationService {
  private evaluations: Evaluation[] = [];
  private evaluationRequests: EvaluationRequest[] = [];
  private nextEvaluationId = 1;

  constructor(private locationService: LocationService) {
    this.loadEvaluationsFromStorage();
  }

  // 평가 요청 생성
  async createEvaluationRequest(post: Post): Promise<EvaluationRequest> {
    try {
      const currentLocation = await this.locationService.getCurrentLocation();
      
      if (!currentLocation) {
        throw new Error('위치 정보를 가져올 수 없습니다.');
      }

      const request: EvaluationRequest = {
        postId: post.id,
        postLocation: currentLocation,
        radius: 1, // 1km 반경
        maxEvaluators: 5, // 최대 5명의 평가자
        timeout: 30 // 30분 대기
      };

      this.evaluationRequests.push(request);
      this.saveEvaluationsToStorage();
      
      console.log('평가 요청 생성:', request);
      return request;
      
    } catch (error) {
      console.error('평가 요청 생성 실패:', error);
      throw error;
    }
  }

  // 평가자에게 평가 요청 전송 (시뮬레이션)
  async sendEvaluationToNearbyUsers(request: EvaluationRequest): Promise<void> {
    console.log('주변 사용자에게 평가 요청 전송 중...');
    
    // 실제로는 백엔드 API를 통해 주변 사용자에게 푸시 알림 전송
    // 현재는 시뮬레이션으로 처리
    
    setTimeout(() => {
      console.log(`평가 요청이 ${request.radius}km 반경 내 사용자들에게 전송되었습니다.`);
    }, 2000);
  }

  // 평가 제출
  async submitEvaluation(
    postId: number, 
    quality: number, 
    publishable: boolean, 
    comment?: string
  ): Promise<Evaluation> {
    try {
      const currentLocation = await this.locationService.getCurrentLocation();
      
      if (!currentLocation) {
        throw new Error('위치 정보를 가져올 수 없습니다.');
      }

      // 거리 계산 (간단한 유클리드 거리)
      const distance = this.calculateDistance(currentLocation, currentLocation); // 실제로는 기사 위치와 비교

      const evaluation: Evaluation = {
        id: this.nextEvaluationId++,
        postId,
        evaluatorId: `user_${Date.now()}`, // 실제로는 사용자 ID
        evaluatorLocation: currentLocation,
        distance,
        quality,
        publishable,
        comment,
        timestamp: new Date()
      };

      this.evaluations.push(evaluation);
      this.saveEvaluationsToStorage();
      
      console.log('평가 제출 완료:', evaluation);
      return evaluation;
      
    } catch (error) {
      console.error('평가 제출 실패:', error);
      throw error;
    }
  }

  // 평가 결과 조회
  getEvaluationsForPost(postId: number): Evaluation[] {
    return this.evaluations.filter(e => e.postId === postId);
  }

  // 평가 통계 계산
  getEvaluationStats(postId: number): {
    totalEvaluations: number;
    averageQuality: number;
    publishableRate: number;
    averageDistance: number;
  } {
    const evaluations = this.getEvaluationsForPost(postId);
    
    if (evaluations.length === 0) {
      return {
        totalEvaluations: 0,
        averageQuality: 0,
        publishableRate: 0,
        averageDistance: 0
      };
    }

    const totalEvaluations = evaluations.length;
    const averageQuality = evaluations.reduce((sum, e) => sum + e.quality, 0) / totalEvaluations;
    const publishableCount = evaluations.filter(e => e.publishable).length;
    const publishableRate = (publishableCount / totalEvaluations) * 100;
    const averageDistance = evaluations.reduce((sum, e) => sum + e.distance, 0) / totalEvaluations;

    return {
      totalEvaluations,
      averageQuality: Math.round(averageQuality * 10) / 10,
      publishableRate: Math.round(publishableRate * 10) / 10,
      averageDistance: Math.round(averageDistance * 100) / 100
    };
  }

  // 평가 대기 중인 요청 조회
  getPendingEvaluationRequests(): EvaluationRequest[] {
    return this.evaluationRequests.filter(request => {
      const requestTime = new Date().getTime();
      const timeoutMs = request.timeout * 60 * 1000; // 분을 밀리초로 변환
      return (requestTime - requestTime) < timeoutMs; // 실제로는 요청 시간과 비교
    });
  }

  // 내가 평가할 수 있는 기사 조회 (시뮬레이션)
  async getAvailablePostsForEvaluation(): Promise<Post[]> {
    try {
      const currentLocation = await this.locationService.getCurrentLocation();
      
      if (!currentLocation) {
        return [];
      }

      // 실제로는 백엔드에서 주변 기사들을 가져옴
      // 현재는 시뮬레이션 데이터 반환
      return [
        {
          id: 1,
          author: 'TruthSync 사용자',
          location: '강남구, 서울',
          distance: 0.5,
          timestamp: '5분 전',
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...',
          headline: '강남역 교통 상황',
          content: 'AI가 분석한 강남역 교통 상황...',
          verificationScore: 85,
          votes: 2,
          likes: 0,
          comments: 0,
          views: 5,
          status: 'pending'
        }
      ];
      
    } catch (error) {
      console.error('평가 가능한 기사 조회 실패:', error);
      return [];
    }
  }

  // 거리 계산 (간단한 유클리드 거리)
  private calculateDistance(loc1: LocationInfo, loc2: LocationInfo): number {
    const latDiff = loc1.latitude - loc2.latitude;
    const lonDiff = loc1.longitude - loc2.longitude;
    return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
  }

  // 로컬 스토리지에서 평가 데이터 로드
  private loadEvaluationsFromStorage(): void {
    try {
      const stored = localStorage.getItem('truthsync_evaluations');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.evaluations = parsed.evaluations || [];
        this.nextEvaluationId = parsed.nextEvaluationId || 1;
      }
    } catch (error) {
      console.error('저장된 평가 데이터 로드 실패:', error);
    }
  }

  // 로컬 스토리지에 평가 데이터 저장
  private saveEvaluationsToStorage(): void {
    try {
      const data = {
        evaluations: this.evaluations,
        nextEvaluationId: this.nextEvaluationId
      };
      localStorage.setItem('truthsync_evaluations', JSON.stringify(data));
    } catch (error) {
      console.error('평가 데이터 저장 실패:', error);
    }
  }
} 