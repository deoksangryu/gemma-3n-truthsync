import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService, Post } from '../../services/post.service';
import { EvaluationService, Evaluation } from '../../services/evaluation.service';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evaluation.component.html',
  styleUrl: './evaluation.component.scss'
})
export class EvaluationComponent implements OnInit {
  availablePosts: Post[] = [];
  selectedPost: Post | null = null;
  isLoading = false;
  evaluationComment = '';
  qualityScore = 3;
  isPublishable = true;
  currentLocation: string = '위치 확인 중...';

  constructor(
    private router: Router,
    private postService: PostService,
    private evaluationService: EvaluationService,
    private locationService: LocationService
  ) {}

  async ngOnInit() {
    await this.loadAvailablePosts();
    await this.updateLocation();
  }

  async loadAvailablePosts() {
    try {
      this.isLoading = true;
      this.availablePosts = await this.evaluationService.getAvailablePostsForEvaluation();
      console.log('평가 가능한 기사:', this.availablePosts.length);
    } catch (error) {
      console.error('평가 가능한 기사 로드 실패:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async updateLocation() {
    try {
      const location = await this.locationService.getCurrentLocation();
      if (location) {
        this.currentLocation = this.locationService.getFullAddress();
      }
    } catch (error) {
      console.error('위치 업데이트 실패:', error);
    }
  }

  selectPost(post: Post) {
    this.selectedPost = post;
    console.log('평가할 기사 선택:', post);
  }

  async submitEvaluation() {
    if (!this.selectedPost) {
      console.error('평가할 기사가 선택되지 않았습니다.');
      return;
    }

    try {
      this.isLoading = true;
      
      const evaluation = await this.evaluationService.submitEvaluation(
        this.selectedPost.id,
        this.qualityScore,
        this.isPublishable,
        this.evaluationComment
      );

      console.log('평가 제출 완료:', evaluation);
      
      // 성공 메시지 표시 후 홈으로 이동
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 2000);
      
    } catch (error) {
      console.error('평가 제출 실패:', error);
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  // 품질 점수 변경
  onQualityChange(score: number) {
    this.qualityScore = score;
  }

  // 게시 가능 여부 토글
  togglePublishable() {
    this.isPublishable = !this.isPublishable;
  }

  // 평가 통계 조회
  getEvaluationStats(postId: number) {
    return this.evaluationService.getEvaluationStats(postId);
  }
} 