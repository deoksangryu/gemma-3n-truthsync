import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface DocumentData {
  image: string;
  article: string;
  submessage: string;
  timestamp: string;
  documentId: string;
}

@Component({
  selector: 'app-document-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-editor.component.html',
  styleUrl: './document-editor.component.scss'
})
export class DocumentEditorComponent implements OnInit {
  documentData: DocumentData | null = null;
  editedArticle: string = '';
  documentTitle: string = '';
  isSaving = false;
  errorMessage = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadDocumentData();
  }

  loadDocumentData() {
    try {
      const savedData = localStorage.getItem('currentDocument');
      if (savedData) {
        this.documentData = JSON.parse(savedData);
        this.editedArticle = this.documentData?.article || '';
        this.documentTitle = `AI 분석 문서 - ${new Date().toLocaleString()}`;
      } else {
        this.errorMessage = '문서 데이터를 찾을 수 없습니다.';
        setTimeout(() => {
          this.router.navigate(['/camera']);
        }, 2000);
      }
    } catch (error) {
      console.error('문서 데이터 로드 오류:', error);
      this.errorMessage = '문서 데이터를 불러오는데 실패했습니다.';
    }
  }

  saveDocument() {
    if (!this.documentData || !this.editedArticle.trim()) {
      this.errorMessage = '편집된 내용이 없습니다.';
      return;
    }

    this.isSaving = true;

    try {
      // 문서 데이터 업데이트
      const updatedDocument = {
        ...this.documentData,
        article: this.editedArticle,
        title: this.documentTitle,
        lastModified: new Date().toISOString()
      };

      // 로컬 스토리지에 저장
      localStorage.setItem('currentDocument', JSON.stringify(updatedDocument));
      
      // 완료된 문서 목록에 추가
      const savedDocuments = JSON.parse(localStorage.getItem('savedDocuments') || '[]');
      savedDocuments.push(updatedDocument);
      localStorage.setItem('savedDocuments', JSON.stringify(savedDocuments));

      this.isSaving = false;
      
      // 성공 메시지와 함께 결과 페이지로 이동
      setTimeout(() => {
        this.router.navigate(['/post-detail']);
      }, 1000);

    } catch (error) {
      console.error('문서 저장 오류:', error);
      this.errorMessage = '문서 저장에 실패했습니다.';
      this.isSaving = false;
    }
  }

  downloadDocument() {
    if (!this.documentData || !this.editedArticle.trim()) {
      this.errorMessage = '다운로드할 내용이 없습니다.';
      return;
    }

    try {
      // HTML 문서 생성
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${this.documentTitle}</title>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .image-container { text-align: center; margin-bottom: 30px; }
            .image-container img { max-width: 100%; max-height: 400px; border-radius: 8px; }
            .content { line-height: 1.6; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${this.documentTitle}</h1>
            <p>생성일: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="image-container">
            <img src="${this.documentData?.image}" alt="분석된 이미지">
          </div>
          
          <div class="content">
            ${this.editedArticle.replace(/\n/g, '<br>')}
          </div>
          
          <div class="footer">
            <p>AI 분석 결과 문서</p>
          </div>
        </body>
        </html>
      `;

      // 파일 다운로드
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.documentTitle}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('문서 다운로드 오류:', error);
      this.errorMessage = '문서 다운로드에 실패했습니다.';
    }
  }

  goBack() {
    this.router.navigate(['/camera']);
  }
}
