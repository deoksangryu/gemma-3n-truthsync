import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface OrientationInfo {
  isLandscape: boolean;
  angle: number;
  type: 'portrait' | 'landscape';
}

@Injectable({
  providedIn: 'root'
})
export class OrientationService {
  private orientationSubject = new BehaviorSubject<OrientationInfo>({
    isLandscape: false,
    angle: 0,
    type: 'portrait'
  });

  public orientation$: Observable<OrientationInfo> = this.orientationSubject.asObservable();

  constructor() {
    this.initializeOrientationDetection();
  }

  private initializeOrientationDetection(): void {
    // 초기 방향 설정
    this.updateOrientation();

    // 화면 방향 변경 감지
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', () => {
        this.updateOrientation();
      });
    } else {
      // fallback: resize 이벤트로 감지
      window.addEventListener('resize', () => {
        this.updateOrientation();
      });
    }

    // 디바이스 방향 변경 감지 (모바일)
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', (event) => {
        this.handleDeviceOrientation(event);
      });
    }
  }

  private updateOrientation(): void {
    const isLandscape = window.innerWidth > window.innerHeight;
    const angle = this.getScreenAngle();
    
    const orientationInfo: OrientationInfo = {
      isLandscape,
      angle,
      type: isLandscape ? 'landscape' : 'portrait'
    };

    this.orientationSubject.next(orientationInfo);
    console.log('화면 방향 변경:', orientationInfo);
  }

  private handleDeviceOrientation(event: DeviceOrientationEvent): void {
    // 알파, 베타, 감마 값을 사용하여 방향 계산
    const alpha = event.alpha || 0;
    const beta = event.beta || 0;
    const gamma = event.gamma || 0;

    // 디바이스 방향에 따른 화면 방향 계산
    let isLandscape = false;
    let angle = 0;

    if (Math.abs(gamma) > 45) {
      isLandscape = true;
      angle = gamma > 0 ? 90 : -90;
    } else if (Math.abs(beta) > 45) {
      isLandscape = false;
      angle = beta > 0 ? 0 : 180;
    }

    const orientationInfo: OrientationInfo = {
      isLandscape,
      angle,
      type: isLandscape ? 'landscape' : 'portrait'
    };

    this.orientationSubject.next(orientationInfo);
  }

  private getScreenAngle(): number {
    if (window.screen && window.screen.orientation) {
      return window.screen.orientation.angle;
    }
    return 0;
  }

  getCurrentOrientation(): OrientationInfo {
    return this.orientationSubject.value;
  }

  isLandscape(): boolean {
    return this.orientationSubject.value.isLandscape;
  }

  isPortrait(): boolean {
    return !this.orientationSubject.value.isLandscape;
  }

  getOrientationType(): 'portrait' | 'landscape' {
    return this.orientationSubject.value.type;
  }

  getOrientationAngle(): number {
    return this.orientationSubject.value.angle;
  }
} 