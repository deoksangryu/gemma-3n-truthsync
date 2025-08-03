import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, NotificationData } from '../../services/notification.service';
import { Subscription, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-badge" (click)="toggleNotifications()">
      <div class="notification-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        </svg>
        <span *ngIf="unreadCount > 0" class="notification-count">{{ unreadCount }}</span>
      </div>
      
      <!-- 알림 드롭다운 -->
      <div *ngIf="showNotifications" class="notification-dropdown">
        <div class="notification-header">
          <h3>알림</h3>
          <button (click)="markAllAsRead()" class="mark-all-read">모두 읽음</button>
        </div>
        
        <div class="notification-list">
          <div *ngFor="let notification of notifications" 
               class="notification-item"
               [class.unread]="!notification.is_read"
               (click)="markAsRead(notification)">
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
            </div>
            <div *ngIf="!notification.is_read" class="unread-indicator"></div>
          </div>
          
          <div *ngIf="notifications.length === 0" class="no-notifications">
            새로운 알림이 없습니다.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-badge {
      position: relative;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: background-color 0.2s;
    }

    .notification-badge:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .notification-icon {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .notification-count {
      position: absolute;
      top: -8px;
      right: -8px;
      background-color: #ef4444;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 12px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .notification-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      width: 320px;
      max-height: 400px;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      overflow: hidden;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      background-color: #f9fafb;
    }

    .notification-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }

    .mark-all-read {
      background: none;
      border: none;
      color: #3b82f6;
      font-size: 14px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background-color 0.2s;
    }

    .mark-all-read:hover {
      background-color: #eff6ff;
    }

    .notification-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
      cursor: pointer;
      transition: background-color 0.2s;
      position: relative;
    }

    .notification-item:hover {
      background-color: #f9fafb;
    }

    .notification-item.unread {
      background-color: #eff6ff;
    }

    .notification-content {
      flex: 1;
    }

    .notification-title {
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
      font-size: 14px;
    }

    .notification-message {
      color: #6b7280;
      font-size: 13px;
      line-height: 1.4;
      margin-bottom: 4px;
    }

    .notification-time {
      color: #9ca3af;
      font-size: 12px;
    }

    .unread-indicator {
      width: 8px;
      height: 8px;
      background-color: #3b82f6;
      border-radius: 50%;
      margin-left: 8px;
      margin-top: 4px;
    }

    .no-notifications {
      padding: 24px 16px;
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
    }

    /* 스크롤바 스타일링 */
    .notification-list::-webkit-scrollbar {
      width: 4px;
    }

    .notification-list::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .notification-list::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 2px;
    }

    .notification-list::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `]
})
export class NotificationBadgeComponent implements OnInit, OnDestroy {
  notifications: NotificationData[] = [];
  unreadCount = 0;
  showNotifications = false;
  private subscriptions: Subscription[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // 알림 목록 구독
    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
        this.updateUnreadCount();
      })
    );

    // 새로운 알림 구독
    this.subscriptions.push(
      this.notificationService.newNotification$.subscribe(notification => {
        // 새로운 알림이 오면 알림 목록을 새로고침
        this.loadNotifications();
      })
    );

    // 초기 알림 로드
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  async loadNotifications(): Promise<void> {
    try {
      const userId = this.getUserId();
      await firstValueFrom(this.notificationService.getNotifications(userId));
    } catch (error) {
      console.error('알림 로드 실패:', error);
    }
  }

  async markAsRead(notification: NotificationData): Promise<void> {
    if (notification.id && !notification.is_read) {
      try {
        await firstValueFrom(this.notificationService.markAsRead(notification.id));
      } catch (error) {
        console.error('알림 읽음 처리 실패:', error);
      }
    }
  }

  async markAllAsRead(): Promise<void> {
    const unreadNotifications = this.notifications.filter(n => !n.is_read);
    
    for (const notification of unreadNotifications) {
      if (notification.id) {
        try {
          await firstValueFrom(this.notificationService.markAsRead(notification.id));
        } catch (error) {
          console.error('알림 읽음 처리 실패:', error);
        }
      }
    }
  }

  private updateUnreadCount(): void {
    this.unreadCount = this.notifications.filter(n => !n.is_read).length;
  }

  private getUserId(): string {
    const userId = localStorage.getItem('userId') || 'anonymous';
    if (userId === 'anonymous') {
      const tempId = 'user_' + Date.now();
      localStorage.setItem('userId', tempId);
      return tempId;
    }
    return userId;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return '방금 전';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}시간 전`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days}일 전`;
    }
  }
} 