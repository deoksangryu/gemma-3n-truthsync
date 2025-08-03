import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotificationData {
  id?: number;
  type: 'review_request' | 'verification_result' | 'system';
  article_id?: number;
  article_title?: string;
  title: string;
  message: string;
  timestamp: string;
  is_read?: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3초

  // 알림 목록
  private notificationsSubject = new BehaviorSubject<NotificationData[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  // 연결 상태
  private connectionStatusSubject = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  // 새로운 알림
  private newNotificationSubject = new Subject<NotificationData>();
  public newNotification$ = this.newNotificationSubject.asObservable();

  // 위치 업데이트 성공/실패
  private locationUpdateSubject = new Subject<{ success: boolean; message: string }>();
  public locationUpdate$ = this.locationUpdateSubject.asObservable();

  constructor() {
    this.initializeWebSocket();
  }

  /**
   * WebSocket 연결 초기화
   */
  private initializeWebSocket(): void {
    const userId = this.getUserId();
    if (!userId) {
      console.warn('사용자 ID가 없어 WebSocket 연결을 건너뜁니다.');
      return;
    }

    const wsUrl = environment.wsUrl + `/ws/${userId}`;
    this.connectionStatusSubject.next('connecting');

    try {
      this.ws = new WebSocket(wsUrl);
      this.setupWebSocketHandlers();
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      this.connectionStatusSubject.next('disconnected');
      this.scheduleReconnect();
    }
  }

  /**
   * WebSocket 이벤트 핸들러 설정
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket 연결됨');
      this.connectionStatusSubject.next('connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        console.error('WebSocket 메시지 파싱 오류:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket 연결 해제됨');
      this.connectionStatusSubject.next('disconnected');
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket 오류:', error);
      this.connectionStatusSubject.next('disconnected');
    };
  }

  /**
   * WebSocket 메시지 처리
   */
  private handleWebSocketMessage(data: any): void {
    switch (data.type) {
      case 'location_updated':
        this.locationUpdateSubject.next({
          success: data.status === 'success',
          message: data.status === 'success' ? '위치가 업데이트되었습니다.' : '위치 업데이트에 실패했습니다.'
        });
        break;

      case 'pong':
        // 연결 상태 확인 응답
        break;

      case 'review_request':
        // 새로운 리뷰 요청 알림
        this.handleNewNotification(data);
        break;

      default:
        console.log('알 수 없는 WebSocket 메시지:', data);
    }
  }

  /**
   * 새로운 알림 처리
   */
  private handleNewNotification(notification: NotificationData): void {
    // 알림 목록에 추가
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [notification, ...currentNotifications];
    this.notificationsSubject.next(updatedNotifications);

    // 새로운 알림 이벤트 발생
    this.newNotificationSubject.next(notification);

    // 브라우저 알림 표시 (사용자가 허용한 경우)
    this.showBrowserNotification(notification);
  }

  /**
   * 브라우저 알림 표시
   */
  private showBrowserNotification(notification: NotificationData): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icons/notification-icon.png',
        tag: 'truthsync-notification'
      });
    }
  }

  /**
   * 위치 업데이트
   */
  updateLocation(location: LocationData): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket이 연결되지 않았습니다.');
      this.locationUpdateSubject.next({
        success: false,
        message: 'WebSocket 연결이 없습니다.'
      });
      return;
    }

    const message = {
      type: 'location_update',
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * 연결 상태 확인 (ping)
   */
  ping(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  /**
   * 수동 재연결
   */
  reconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.initializeWebSocket();
  }

  /**
   * 자동 재연결 스케줄링
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectInterval);
    } else {
      console.error('최대 재연결 시도 횟수를 초과했습니다.');
    }
  }

  /**
   * 알림 목록 가져오기
   */
  getNotifications(userId: string, limit: number = 20, offset: number = 0): Observable<any> {
    const url = `${environment.apiUrl}/notifications/${userId}?limit=${limit}&offset=${offset}`;
    
    return new Observable(observer => {
      fetch(url)
        .then(response => response.json())
        .then(data => {
          this.notificationsSubject.next(data.notifications || []);
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          console.error('알림 목록 가져오기 실패:', error);
          observer.error(error);
        });
    });
  }

  /**
   * 알림 읽음 처리
   */
  markAsRead(notificationId: number): Observable<any> {
    const url = `${environment.apiUrl}/notifications/${notificationId}/read`;
    
    return new Observable(observer => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(data => {
          // 로컬 알림 목록에서 읽음 처리
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true }
              : notification
          );
          this.notificationsSubject.next(updatedNotifications);
          
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          console.error('알림 읽음 처리 실패:', error);
          observer.error(error);
        });
    });
  }

  /**
   * 브라우저 알림 권한 요청
   */
  requestNotificationPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          resolve(true);
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            resolve(permission === 'granted');
          });
        } else {
          resolve(false);
        }
      } else {
        resolve(false);
      }
    });
  }

  /**
   * 사용자 ID 가져오기 (임시 구현)
   */
  private getUserId(): string {
    // 실제 구현에서는 사용자 인증 시스템에서 가져와야 함
    const userId = localStorage.getItem('userId') || 'anonymous';
    if (userId === 'anonymous') {
      // 임시 사용자 ID 생성
      const tempId = 'user_' + Date.now();
      localStorage.setItem('userId', tempId);
      return tempId;
    }
    return userId;
  }

  /**
   * 서비스 정리
   */
  ngOnDestroy(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
} 