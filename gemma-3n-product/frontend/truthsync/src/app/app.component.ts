import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BottomNavComponent } from './shared/bottom-nav/bottom-nav.component';
import { NotificationBadgeComponent } from './shared/notification-badge/notification-badge.component';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, BottomNavComponent, NotificationBadgeComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'truthsync';
  
  constructor(
    private router: Router,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit(): void {
    // 브라우저 알림 권한 요청
    this.requestNotificationPermission();
  }
  
  isLoginRoute(): boolean {
    return this.router.url === '/login' || this.router.url === '';
  }
  
  private async requestNotificationPermission(): Promise<void> {
    try {
      const hasPermission = await this.notificationService.requestNotificationPermission();
      if (hasPermission) {
        console.log('브라우저 알림 권한이 허용되었습니다.');
      } else {
        console.log('브라우저 알림 권한이 거부되었습니다.');
      }
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
    }
  }
}
