import { Injectable } from '@angular/core';
import { LocationService } from './location.service';

export interface Post {
  id: number;
  author: string;
  location: string;
  distance: number;
  timestamp: string;
  image: string;
  headline: string;
  content: string;
  verificationScore: number;
  votes: number;
  likes: number;
  comments: number;
  views: number;
  status: 'verified' | 'pending';
  submessage?: string; // 부연설명 추가
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private posts: Post[] = [];
  private nextId = 1;
  private isCreatingPost = false; // 중복 생성 방지 플래그

  constructor(private locationService: LocationService) {
    // 로컬 스토리지에서 기존 포스트 로드
    this.loadPostsFromStorage();
  }

  getPosts(): Post[] {
    return this.posts;
  }

  getPostById(id: number): Post | undefined {
    return this.posts.find(p => p.id === id);
  }

  // 새 기사 생성
  async createPost(
    image: string, 
    content: string, 
    submessage: string = '',
    headline?: string
  ): Promise<Post> {
    // 중복 생성 방지
    if (this.isCreatingPost) {
      console.log('Post 생성이 이미 진행 중입니다.');
      throw new Error('Post 생성이 이미 진행 중입니다.');
    }

    try {
      this.isCreatingPost = true;
      console.log('=== Post 서비스: 새 기사 생성 시작 ===');
      console.log('이미지 크기:', image.length);
      console.log('내용 길이:', content.length);
      console.log('부연설명:', submessage);
      console.log('제목:', headline);
      
      // 현재 위치 정보 가져오기
      const locationInfo = this.locationService.getCurrentLocationInfo();
      const location = locationInfo ? this.locationService.getFullAddress() : '위치 정보 없음';
      console.log('위치 정보:', location);
      
      // 현재 시간
      const now = new Date();
      const timestamp = this.formatTimestamp(now);
      console.log('타임스탬프:', timestamp);
      
      // 제목이 없으면 내용에서 추출
      const finalHeadline = headline || this.extractHeadline(content);
      console.log('최종 제목:', finalHeadline);
      
      // 새 포스트 생성
      const newPost: Post = {
        id: this.nextId++,
        author: 'TruthSync 사용자',
        location,
        distance: 0, // 현재 위치 기준
        timestamp,
        image,
        headline: finalHeadline,
        content,
        verificationScore: 85, // 기본 진실도 (AI 분석 완료)
        votes: 0,
        likes: 0,
        comments: 0,
        views: 0,
        status: 'pending', // 검증 대기 상태
        submessage
      };

      console.log('새 Post 객체 생성:', newPost.id);

      // 포스트 목록에 추가 (최신순으로 맨 앞에)
      this.posts.unshift(newPost);
      console.log('Post 목록에 추가 완료. 총 Post 수:', this.posts.length);
      
      // 로컬 스토리지에 저장
      this.savePostsToStorage();
      console.log('로컬 스토리지 저장 완료');
      
      console.log('=== Post 서비스: 새 기사 생성 완료 ===');
      return newPost;
      
    } catch (error) {
      console.error('Post 생성 실패:', error);
      throw error;
    } finally {
      this.isCreatingPost = false;
    }
  }

  // 기사 업데이트
  updatePost(id: number, updates: Partial<Post>): boolean {
    const index = this.posts.findIndex(p => p.id === id);
    if (index !== -1) {
      this.posts[index] = { ...this.posts[index], ...updates };
      this.savePostsToStorage();
      return true;
    }
    return false;
  }

  // 기사 삭제
  deletePost(id: number): boolean {
    const index = this.posts.findIndex(p => p.id === id);
    if (index !== -1) {
      this.posts.splice(index, 1);
      this.savePostsToStorage();
      return true;
    }
    return false;
  }

  // 좋아요 토글
  toggleLike(id: number): boolean {
    const post = this.getPostById(id);
    if (post) {
      // 간단한 토글 로직 (실제로는 사용자별 좋아요 상태 관리 필요)
      post.likes = post.likes > 0 ? 0 : 1;
      this.savePostsToStorage();
      return true;
    }
    return false;
  }

  // 조회수 증가
  incrementViews(id: number): boolean {
    const post = this.getPostById(id);
    if (post) {
      post.views++;
      this.savePostsToStorage();
      return true;
    }
    return false;
  }

  // 내용에서 제목 추출
  private extractHeadline(content: string): string {
    // 첫 번째 문장이나 줄을 제목으로 사용
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    
    if (firstLine.length > 0) {
      // 제목이 너무 길면 자르기
      return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    }
    
    return '새로운 기사';
  }

  // 타임스탬프 포맷팅
  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  }

  // 로컬 스토리지에서 포스트 로드
  private loadPostsFromStorage(): void {
    try {
      const stored = localStorage.getItem('truthsync_posts');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.posts = parsed.posts || [];
        this.nextId = parsed.nextId || 1;
      }
    } catch (error) {
      console.error('저장된 포스트 로드 실패:', error);
    }
  }

  // 로컬 스토리지에 포스트 저장
  private savePostsToStorage(): void {
    try {
      const data = {
        posts: this.posts,
        nextId: this.nextId
      };
      localStorage.setItem('truthsync_posts', JSON.stringify(data));
    } catch (error) {
      console.error('포스트 저장 실패:', error);
    }
  }
}
