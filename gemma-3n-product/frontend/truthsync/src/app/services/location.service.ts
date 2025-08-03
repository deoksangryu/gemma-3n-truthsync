import { Injectable } from '@angular/core';
import { NotificationService, LocationData } from './notification.service';

export interface LocationInfo {
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  city: string;
  country: string;
  accuracy?: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private currentLocation: LocationInfo | null = null;
  private locationWatcher: number | null = null;

  constructor(private notificationService: NotificationService) {
    this.initializeLocation();
  }

  async initializeLocation(): Promise<void> {
    try {
      // 브라우저에서 위치 서비스 지원 확인
      if (!navigator.geolocation) {
        console.warn('Geolocation이 지원되지 않습니다.');
        return;
      }

      // 현재 위치 가져오기
      await this.getCurrentLocation();
      
      // 위치 변경 감지 시작
      this.startLocationWatching();
      
    } catch (error) {
      console.error('위치 초기화 실패:', error);
    }
  }

  async getCurrentLocation(): Promise<LocationInfo | null> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation이 지원되지 않습니다.'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1분 캐시
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const locationInfo = await this.getLocationInfo(
              position.coords.latitude,
              position.coords.longitude
            );
            
            this.currentLocation = {
              ...locationInfo,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            
            console.log('현재 위치 업데이트:', this.currentLocation);
            
            // WebSocket을 통해 위치 업데이트 전송
            this.updateLocationToServer();
            
            resolve(this.currentLocation);
            
          } catch (error) {
            console.error('위치 정보 변환 실패:', error);
            // 기본 위치 정보라도 반환
            this.currentLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: '위치 확인 중...',
              district: '위치 확인 중...',
              city: '위치 확인 중...',
              country: '대한민국',
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            };
            
            // WebSocket을 통해 위치 업데이트 전송
            this.updateLocationToServer();
            
            resolve(this.currentLocation);
          }
        },
        (error) => {
          console.error('위치 가져오기 실패:', error);
          reject(error);
        },
        options
      );
    });
  }

  /**
   * 서버에 위치 정보 업데이트
   */
  private updateLocationToServer(): void {
    if (this.currentLocation) {
      const locationData: LocationData = {
        latitude: this.currentLocation.latitude,
        longitude: this.currentLocation.longitude,
        accuracy: this.currentLocation.accuracy
      };
      
      // WebSocket을 통해 실시간 위치 업데이트
      this.notificationService.updateLocation(locationData);
      
      // HTTP를 통한 백업 위치 업데이트
      this.updateLocationViaHttp(locationData);
    }
  }

  /**
   * HTTP를 통한 위치 업데이트 (백업)
   */
  private async updateLocationViaHttp(locationData: LocationData): Promise<void> {
    try {
      const userId = this.getUserId();
      const url = `${this.getApiUrl()}/users/${userId}/location`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(locationData)
      });

      if (!response.ok) {
        throw new Error('HTTP 위치 업데이트 실패');
      }

      console.log('HTTP 위치 업데이트 성공');
    } catch (error) {
      console.error('HTTP 위치 업데이트 실패:', error);
    }
  }

  /**
   * 근처 사용자 조회
   */
  async getNearbyUsers(radiusKm: number = 1.0): Promise<any> {
    if (!this.currentLocation) {
      throw new Error('현재 위치 정보가 없습니다.');
    }

    try {
      const url = `${this.getApiUrl()}/users/nearby?latitude=${this.currentLocation.latitude}&longitude=${this.currentLocation.longitude}&radius_km=${radiusKm}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('근처 사용자 조회 실패');
      }

      const data = await response.json();
      console.log('근처 사용자:', data);
      return data;
    } catch (error) {
      console.error('근처 사용자 조회 실패:', error);
      throw error;
    }
  }

  private async getLocationInfo(latitude: number, longitude: number): Promise<Omit<LocationInfo, 'accuracy' | 'timestamp'>> {
    try {
      // Reverse Geocoding API 호출 (OpenStreetMap Nominatim 사용)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
          }
        }
      );

      if (!response.ok) {
        throw new Error('위치 정보를 가져올 수 없습니다.');
      }

      const data = await response.json();
      const address = data.display_name || '';
      
      // 주소에서 구(區) 정보 추출
      let district = '위치 확인 중...';
      if (data.address) {
        district = data.address.suburb || 
                  data.address.district || 
                  data.address.city_district || 
                  data.address.county || 
                  '위치 확인 중...';
      }

      return {
        latitude,
        longitude,
        address,
        district,
        city: data.address?.city || data.address?.state || '서울',
        country: data.address?.country || '대한민국'
      };
      
    } catch (error) {
      console.error('Reverse geocoding 실패:', error);
      // 기본 정보 반환
      return {
        latitude,
        longitude,
        address: '위치 확인 중...',
        district: '위치 확인 중...',
        city: '서울',
        country: '대한민국'
      };
    }
  }

  private startLocationWatching(): void {
    if (!navigator.geolocation) {
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5분 캐시
    };

    this.locationWatcher = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const locationInfo = await this.getLocationInfo(
            position.coords.latitude,
            position.coords.longitude
          );
          
          this.currentLocation = {
            ...locationInfo,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          
          console.log('위치 업데이트:', this.currentLocation);
          
          // WebSocket을 통해 위치 업데이트 전송
          this.updateLocationToServer();
          
        } catch (error) {
          console.error('위치 업데이트 실패:', error);
        }
      },
      (error) => {
        console.error('위치 감시 실패:', error);
      },
      options
    );
  }

  getCurrentLocationInfo(): LocationInfo | null {
    return this.currentLocation;
  }

  getDistrictName(): string {
    return this.currentLocation?.district || '위치 확인 중...';
  }

  getFullAddress(): string {
    if (!this.currentLocation) {
      return '위치 확인 중...';
    }
    
    return `${this.currentLocation.district}, ${this.currentLocation.city}`;
  }

  /**
   * 위치 정보를 submessage 형식으로 반환
   */
  getLocationForSubmessage(): string {
    if (!this.currentLocation) {
      return '';
    }
    
    return `촬영 위치: ${this.currentLocation.latitude},${this.currentLocation.longitude} (${this.currentLocation.district}, ${this.currentLocation.city})`;
  }

  stopLocationWatching(): void {
    if (this.locationWatcher !== null) {
      navigator.geolocation.clearWatch(this.locationWatcher);
      this.locationWatcher = null;
    }
  }

  // 위치 권한 요청
  async requestLocationPermission(): Promise<boolean> {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000
        });
      });
      
      return true;
    } catch (error) {
      console.error('위치 권한 요청 실패:', error);
      return false;
    }
  }

  /**
   * 사용자 ID 가져오기
   */
  private getUserId(): string {
    const userId = localStorage.getItem('userId') || 'anonymous';
    if (userId === 'anonymous') {
      const tempId = 'user_' + Date.now();
      localStorage.setItem('userId', tempId);
      return tempId;
    }
    return userId;
  }

  /**
   * API URL 가져오기
   */
  private getApiUrl(): string {
    // 환경 설정에서 가져오거나 기본값 사용
    return 'http://localhost:8000';
  }
} 