import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { PostService, Post } from '../../services/post.service';
import { LocationService, LocationInfo } from '../../services/location.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  currentLocation: LocationInfo | null = null;
  districtName: string = '위치 확인 중...';
  isLoadingLocation: boolean = true;
  deleteConfirmations: { [key: number]: boolean } = {}; // 삭제 확인 상태

  constructor(
    private router: Router, 
    private postService: PostService,
    private locationService: LocationService
  ) {
    this.refreshPosts();
  }

  async ngOnInit() {
    try {
      // 위치 권한 요청
      const hasPermission = await this.locationService.requestLocationPermission();
      
      if (hasPermission) {
        // 현재 위치 가져오기
        this.currentLocation = await this.locationService.getCurrentLocation();
        this.districtName = this.locationService.getDistrictName();
      } else {
        console.warn('위치 권한이 거부되었습니다.');
        this.districtName = '위치 권한 없음';
      }
      
    } catch (error) {
      console.error('위치 초기화 실패:', error);
      this.districtName = '위치 확인 실패';
    } finally {
      this.isLoadingLocation = false;
    }

    // 위치 변경 감지
    this.startLocationMonitoring();
  }

  ngOnDestroy() {
    this.locationService.stopLocationWatching();
  }

  // 포스트 목록 새로고침
  refreshPosts() {
    console.log('=== 홈 컴포넌트: 포스트 목록 새로고침 시작 ===');
    const oldCount = this.posts.length;
    this.posts = this.postService.getPosts();
    const newCount = this.posts.length;
    console.log(`포스트 수 변경: ${oldCount} → ${newCount}`);
    console.log('=== 홈 컴포넌트: 포스트 목록 새로고침 완료 ===');
  }

  // 컴포넌트가 활성화될 때 포스트 새로고침
  onActivate() {
    this.refreshPosts();
  }

  private startLocationMonitoring() {
    // 주기적으로 위치 정보 업데이트
    setInterval(() => {
      const location = this.locationService.getCurrentLocationInfo();
      if (location) {
        this.currentLocation = location;
        this.districtName = this.locationService.getDistrictName();
      }
    }, 30000); // 30초마다 업데이트
  }

  goToDetail(post: Post) {
    this.router.navigate(['/post', post.id]);
  }

  // 카메라 촬영 모드로 이동
  goToCamera() {
    console.log('카메라 촬영 모드로 이동');
    this.router.navigate(['/camera']);
  }

  // 평가 화면으로 이동
  goToEvaluation() {
    console.log('평가 화면으로 이동');
    this.router.navigate(['/evaluation']);
  }

  // 위치 새로고침
  async refreshLocation() {
    this.isLoadingLocation = true;
    try {
      this.currentLocation = await this.locationService.getCurrentLocation();
      this.districtName = this.locationService.getDistrictName();
    } catch (error) {
      console.error('위치 새로고침 실패:', error);
      this.districtName = '위치 확인 실패';
    } finally {
      this.isLoadingLocation = false;
    }
  }

  // 기사 삭제
  deletePost(post: Post) {
    // 첫 번째 클릭: 삭제 확인 모드 활성화
    if (!this.deleteConfirmations[post.id]) {
      this.deleteConfirmations[post.id] = true;
      // 3초 후 자동으로 확인 모드 해제
      setTimeout(() => {
        this.deleteConfirmations[post.id] = false;
      }, 3000);
      return;
    }

    // 두 번째 클릭: 실제 삭제 실행
    if (confirm(`"${post.headline}" 기사를 삭제하시겠습니까?\n\n삭제된 기사는 복구할 수 없습니다.`)) {
      const success = this.postService.deletePost(post.id);
      if (success) {
        this.refreshPosts();
        console.log(`기사 ID ${post.id} 삭제 완료`);
        alert('기사가 삭제되었습니다.');
      } else {
        console.error('기사 삭제 실패');
        alert('기사 삭제에 실패했습니다.');
      }
    }
    
    // 확인 모드 해제
    this.deleteConfirmations[post.id] = false;
  }
}
