from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
import time
import json
from transformers import pipeline, TextStreamer
import torch
from PIL import Image
import io
import asyncio
import base64
import sqlite3
from datetime import datetime
import os
from typing import Optional, List, Dict, Any

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS (필요시 프론트엔드 주소로 제한 가능)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 설정
DATABASE_PATH = "truthsync_articles.db"

def init_database():
    """데이터베이스 초기화 및 테이블 생성"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # 기사 테이블 생성
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id TEXT UNIQUE NOT NULL,
                title TEXT,
                content TEXT NOT NULL,
                image_data BLOB,
                submessage TEXT,
                location TEXT,
                orientation TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'published',
                verification_score REAL DEFAULT 0.0,
                verification_count INTEGER DEFAULT 0
            )
        """)
        
        # 검증 테이블 생성
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS verifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_id INTEGER NOT NULL,
                user_id TEXT,
                user_location TEXT,
                verification_type TEXT CHECK(verification_type IN ('truth', 'fake', 'unsure')),
                confidence_score REAL,
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (article_id) REFERENCES articles (id)
            )
        """)
        
        # 사용자 테이블 생성
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                username TEXT,
                email TEXT,
                location TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
        logger.info("데이터베이스 초기화 완료")
        
    except Exception as e:
        logger.error(f"데이터베이스 초기화 실패: {e}")

def save_article_to_db(request_id: str, content: str, image_data: Optional[bytes] = None, 
                      submessage: str = "", location: str = "", orientation: str = "") -> bool:
    """기사를 데이터베이스에 저장"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # 제목 추출 (첫 번째 문장을 제목으로 사용)
        title = content.split('.')[0][:100] + "..." if len(content.split('.')[0]) > 100 else content.split('.')[0]
        
        cursor.execute("""
            INSERT INTO articles (request_id, title, content, image_data, submessage, location, orientation)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (request_id, title, content, image_data, submessage, location, orientation))
        
        conn.commit()
        conn.close()
        logger.info(f"기사 저장 완료: {request_id}")
        return True
        
    except Exception as e:
        logger.error(f"기사 저장 실패: {e}")
        return False

def get_article_by_id(article_id: int) -> Optional[Dict[str, Any]]:
    """ID로 기사 조회"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM articles WHERE id = ?", (article_id,))
        row = cursor.fetchone()
        
        conn.close()
        
        if row:
            return dict(row)
        return None
        
    except Exception as e:
        logger.error(f"기사 조회 실패: {e}")
        return None

def get_all_articles(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    """모든 기사 조회"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM articles 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        """, (limit, offset))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
        
    except Exception as e:
        logger.error(f"기사 목록 조회 실패: {e}")
        return []

def add_verification(article_id: int, user_id: str, user_location: str, 
                    verification_type: str, confidence_score: float = 0.0, comment: str = "") -> bool:
    """검증 정보 추가"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO verifications (article_id, user_id, user_location, verification_type, confidence_score, comment)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (article_id, user_id, user_location, verification_type, confidence_score, comment))
        
        # 검증 점수 업데이트
        cursor.execute("""
            UPDATE articles 
            SET verification_count = verification_count + 1,
                verification_score = (
                    SELECT AVG(CASE 
                        WHEN verification_type = 'truth' THEN 1.0
                        WHEN verification_type = 'fake' THEN 0.0
                        ELSE 0.5
                    END)
                    FROM verifications 
                    WHERE article_id = ?
                )
            WHERE id = ?
        """, (article_id, article_id))
        
        conn.commit()
        conn.close()
        logger.info(f"검증 정보 추가 완료: article_id={article_id}, type={verification_type}")
        return True
        
    except Exception as e:
        logger.error(f"검증 정보 추가 실패: {e}")
        return False

# 데이터베이스 초기화
init_database()

# Gemma-3n 파이프라인 초기화 (서버 시작 시 1회)
logger.info("Gemma-3n 모델 로딩 중...")
pipe = pipeline(
    "image-text-to-text",
    model="google/gemma-3n-e4b-it",
    device="cpu",
    torch_dtype=torch.bfloat16,
)
logger.info("Gemma-3n 모델 로딩 완료")

# 분석 상태 저장
analysis_status = {}

@app.get("/")
async def root():
    return {"message": "Gemma-3n AI 서버가 실행 중입니다"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": pipe is not None}

@app.get("/analysis-status/{request_id}")
async def get_analysis_status(request_id: str):
    if request_id in analysis_status:
        return analysis_status[request_id]
    return {"status": "not_found"}

# 새로운 API 엔드포인트들
@app.get("/articles")
async def get_articles(limit: int = 50, offset: int = 0):
    """모든 기사 조회"""
    articles = get_all_articles(limit=limit, offset=offset)
    return {
        "articles": articles,
        "total": len(articles),
        "limit": limit,
        "offset": offset
    }

@app.get("/articles/{article_id}")
async def get_article(article_id: int):
    """특정 기사 조회"""
    article = get_article_by_id(article_id)
    if article:
        return article
    return JSONResponse(
        status_code=404,
        content={"error": "기사를 찾을 수 없습니다."}
    )

@app.post("/articles/{article_id}/verify")
async def verify_article(
    article_id: int,
    user_id: str,
    user_location: str,
    verification_type: str,
    confidence_score: float = 0.0,
    comment: str = ""
):
    """기사 검증"""
    if verification_type not in ["truth", "fake", "unsure"]:
        return JSONResponse(
            status_code=400,
            content={"error": "검증 타입은 'truth', 'fake', 'unsure' 중 하나여야 합니다."}
        )
    
    success = add_verification(
        article_id=article_id,
        user_id=user_id,
        user_location=user_location,
        verification_type=verification_type,
        confidence_score=confidence_score,
        comment=comment
    )
    
    if success:
        return {"message": "검증이 성공적으로 추가되었습니다."}
    else:
        return JSONResponse(
            status_code=500,
            content={"error": "검증 추가에 실패했습니다."}
        )

@app.get("/articles/{article_id}/verifications")
async def get_article_verifications(article_id: int):
    """기사의 검증 정보 조회"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM verifications 
            WHERE article_id = ? 
            ORDER BY created_at DESC
        """, (article_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return {
            "article_id": article_id,
            "verifications": [dict(row) for row in rows],
            "total": len(rows)
        }
        
    except Exception as e:
        logger.error(f"검증 정보 조회 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "검증 정보 조회에 실패했습니다."}
        )

@app.delete("/articles/{article_id}")
async def delete_article(article_id: int):
    """기사 삭제"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        
        # 기사 존재 확인
        cursor.execute("SELECT id FROM articles WHERE id = ?", (article_id,))
        if not cursor.fetchone():
            conn.close()
            return JSONResponse(
                status_code=404,
                content={"error": "기사를 찾을 수 없습니다."}
            )
        
        # 관련 검증 정보 삭제
        cursor.execute("DELETE FROM verifications WHERE article_id = ?", (article_id,))
        
        # 기사 삭제
        cursor.execute("DELETE FROM articles WHERE id = ?", (article_id,))
        
        conn.commit()
        conn.close()
        
        return {"message": "기사가 성공적으로 삭제되었습니다."}
        
    except Exception as e:
        logger.error(f"기사 삭제 실패: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": "기사 삭제에 실패했습니다."}
        )

@app.post("/generate-article")
async def generate_article(
    image: UploadFile = File(...),
    submessage: str = Form("")
):
    request_id = f"req_{int(time.time())}"
    analysis_status[request_id] = {
        "status": "processing",
        "message": "AI 분석을 시작합니다...",
        "progress": 0
    }
    
    logger.info(f"AI 분석 요청 받음: {image.filename}, 부연설명: {submessage}, 요청 ID: {request_id}")
    
    try:
        # 이미지 파일 검증
        if not image.content_type or not image.content_type.startswith('image/'):
            logger.error(f"잘못된 파일 타입: {image.content_type}")
            analysis_status[request_id] = {
                "status": "error",
                "message": "잘못된 파일 타입입니다."
            }
            return JSONResponse(
                status_code=400,
                content={"error": "잘못된 파일 타입", "message": "이미지 파일만 업로드 가능합니다."}
            )
        
        # 파일 크기 검증 (10MB 제한)
        if image.size and image.size > 10 * 1024 * 1024:
            logger.error(f"파일 크기가 너무 큼: {image.size} bytes")
            analysis_status[request_id] = {
                "status": "error",
                "message": "파일 크기가 너무 큽니다."
            }
            return JSONResponse(
                status_code=413,
                content={"error": "파일 크기 초과", "message": "이미지 파일이 너무 큽니다. 10MB 이하로 업로드해주세요."}
            )
        
        # 업로드된 이미지를 임시 파일로 저장
        temp_image_path = f"temp_{image.filename}"
        logger.info(f"이미지 저장 중: {temp_image_path}")
        
        analysis_status[request_id] = {
            "status": "processing",
            "message": "이미지를 처리하고 있습니다...",
            "progress": 10
        }
        
        # 메모리에서 직접 이미지 처리
        logger.info("메모리에서 이미지 처리 시작")
        
        try:
            # 업로드된 이미지를 메모리에서 직접 읽기
            image_data = await image.read()
            
            # PIL로 메모리에서 직접 이미지 열기
            with Image.open(io.BytesIO(image_data)) as img:
                logger.info(f"이미지 정보: {img.format}, {img.size}, {img.mode}")
                
                # EXIF 정보에서 회전 정보 확인 및 적용
                try:
                    # EXIF 태그에서 회전 정보 확인
                    exif = img._getexif()
                    if exif:
                        orientation = exif.get(274)  # 274 is the orientation tag
                        logger.info(f"EXIF 방향 정보: {orientation}")
                        
                        # 회전 정보에 따라 이미지 회전
                        if orientation == 3:
                            img = img.rotate(180, expand=True)
                            logger.info("이미지 180도 회전 적용")
                        elif orientation == 6:
                            img = img.rotate(270, expand=True)
                            logger.info("이미지 270도 회전 적용")
                        elif orientation == 8:
                            img = img.rotate(90, expand=True)
                            logger.info("이미지 90도 회전 적용")
                except Exception as exif_error:
                    logger.warning(f"EXIF 정보 처리 실패: {exif_error}")
                
                # 가로/세로 비율 확인 및 가로 사진 처리
                width, height = img.size
                is_landscape = width > height
                
                # 가로 사진인 경우 90도 회전하여 세로로 표시
                if is_landscape:
                    img = img.rotate(90, expand=True)
                    logger.info(f"가로 사진을 90도 회전하여 세로로 변환: {img.size}")
                
                # 이미지 크기 제한 (비율 유지하면서 리사이즈)
                max_size = (1920, 1080)
                if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                    # 비율을 유지하면서 리사이즈
                    img.thumbnail(max_size, Image.Resampling.LANCZOS)
                    logger.info(f"이미지 리사이즈 완료: {img.size}")
                
                # 리사이즈된 이미지를 메모리에 저장
                img_buffer = io.BytesIO()
                img.save(img_buffer, format="JPEG", quality=85)
                img_buffer.seek(0)
                
                # 메모리에서 이미지 데이터 추출
                processed_image_data = img_buffer.getvalue()
                
        except Exception as img_error:
            logger.error(f"이미지 처리 실패: {img_error}")
            analysis_status[request_id] = {
                "status": "error",
                "message": "이미지 파일 오류입니다."
            }
            return JSONResponse(
                status_code=400,
                content={"error": "이미지 파일 오류", "message": "올바른 이미지 파일이 아닙니다."}
            )

        analysis_status[request_id] = {
            "status": "processing",
            "message": "AI 모델을 실행하고 있습니다...",
            "progress": 30
        }

        # 메시지 구성 - 메모리 데이터 사용
        messages = [
            {
                "role": "system",
                "content": [
                    {"type": "text", "text": "당신은 TruthSync 뉴스 기자 입니다. 이미지를 통해 상세히 기사를 작성해주세요."}
                ]
            },
            {
                "role": "user",
                "content": [
                    {"type": "image", "url": f"data:image/jpeg;base64,{base64.b64encode(processed_image_data).decode()}"},
                    {"type": "text", "text": f"이 이미지의 주제가 무엇인가요? 부연설명 : {submessage}"}
                ]
            }
        ]

        # 방향 정보가 포함된 경우 프롬프트 개선
        if "촬영 방향:" in submessage:
            # 방향 정보 추출
            orientation_match = None
            if "촬영 방향: landscape" in submessage:
                orientation_match = "가로 방향으로 촬영된 이미지입니다. 가로 화면의 특성을 고려하여 기사를 작성해주세요."
            elif "촬영 방향: portrait" in submessage:
                orientation_match = "세로 방향으로 촬영된 이미지입니다. 세로 화면의 특성을 고려하여 기사를 작성해주세요."
            
            if orientation_match:
                # 시스템 메시지에 방향 정보 추가
                messages[0]["content"][0]["text"] += f" {orientation_match}"
                logger.info(f"방향 정보 추가됨: {orientation_match}")

        logger.info("AI 모델 실행 시작")
        
        analysis_status[request_id] = {
            "status": "processing",
            "message": "AI가 이미지를 분석하고 있습니다...",
            "progress": 50
        }
        
        # 스트리밍 텍스트 생성
        generated_text = ""
        
        def text_streamer_callback(text):
            nonlocal generated_text
            generated_text += text
            # 진행 상태 업데이트
            analysis_status[request_id] = {
                "status": "processing",
                "message": f"기사 생성 중... ({len(generated_text)}자)",
                "progress": 50 + (len(generated_text) / 20),  # 예상 1000자 기준
                "partial_text": generated_text
            }
            logger.info(f"스트리밍 텍스트: {text}")
        
        # TextStreamer 설정
        streamer = TextStreamer(
            tokenizer=pipe.tokenizer,
            skip_prompt=True,
            skip_special_tokens=True,
            callback=text_streamer_callback
        )
        
        # 모델 실행 (스트리밍)
        output = pipe(
            text=messages, 
            max_new_tokens=1000,
            streamer=streamer
        )
        
        # 최종 텍스트 추출
        article = output[0]["generated_text"][-1]["content"]
        
        logger.info(f"AI 분석 완료: {len(article)} 문자 생성")
        
        # 데이터베이스에 기사 저장
        location_info = ""
        orientation_info = ""
        
        # submessage에서 위치 및 방향 정보 추출
        if "촬영 위치:" in submessage:
            location_start = submessage.find("촬영 위치:") + 6
            location_end = submessage.find(")", location_start)
            if location_end > location_start:
                location_info = submessage[location_start:location_end].strip()
        
        if "촬영 방향:" in submessage:
            orientation_start = submessage.find("촬영 방향:") + 6
            orientation_end = submessage.find(",", orientation_start)
            if orientation_end > orientation_start:
                orientation_info = submessage[orientation_start:orientation_end].strip()
        
        # 데이터베이스에 저장
        save_success = save_article_to_db(
            request_id=request_id,
            content=article,
            image_data=processed_image_data,
            submessage=submessage,
            location=location_info,
            orientation=orientation_info
        )
        
        analysis_status[request_id] = {
            "status": "completed",
            "message": "AI 분석이 완료되었습니다.",
            "progress": 100,
            "article": article,
            "saved_to_db": save_success
        }
        
        return JSONResponse(content={
            "article": article, 
            "request_id": request_id,
            "saved_to_db": save_success
        })
        
    except Exception as e:
        logger.error(f"AI 분석 중 오류 발생: {str(e)}")
        analysis_status[request_id] = {
            "status": "error",
            "message": f"AI 분석 중 오류가 발생했습니다: {str(e)}"
        }
        return JSONResponse(
            status_code=500,
            content={"error": "AI 분석 실패", "message": str(e)}
        )

# 스트리밍 엔드포인트 추가
@app.post("/generate-article-stream")
async def generate_article_stream(
    image: UploadFile = File(...),
    submessage: str = Form("")
):
    request_id = f"stream_{int(time.time())}"
    
    async def generate_stream():
        temp_image_path = None
        try:
            # 이미지 파일 검증
            if not image.content_type or not image.content_type.startswith('image/'):
                yield f"data: {json.dumps({'error': '잘못된 파일 타입입니다.', 'request_id': request_id})}\n\n"
                return
            
            # 파일 크기 검증 (10MB 제한)
            if image.size and image.size > 10 * 1024 * 1024:
                yield f"data: {json.dumps({'error': '파일 크기가 너무 큽니다.', 'request_id': request_id})}\n\n"
                return

            # 메모리에서 직접 이미지 처리
            logger.info("메모리에서 이미지 처리 시작")
            
            try:
                # 업로드된 이미지를 메모리에서 직접 읽기
                image_data = await image.read()
                
                # PIL로 메모리에서 직접 이미지 열기
                with Image.open(io.BytesIO(image_data)) as img:
                    logger.info(f"이미지 정보: {img.format}, {img.size}, {img.mode}")
                    
                    # EXIF 정보에서 회전 정보 확인 및 적용
                    try:
                        # EXIF 태그에서 회전 정보 확인
                        exif = img._getexif()
                        if exif:
                            orientation = exif.get(274)  # 274 is the orientation tag
                            logger.info(f"EXIF 방향 정보: {orientation}")
                            
                            # 회전 정보에 따라 이미지 회전
                            if orientation == 3:
                                img = img.rotate(180, expand=True)
                                logger.info("이미지 180도 회전 적용")
                            elif orientation == 6:
                                img = img.rotate(270, expand=True)
                                logger.info("이미지 270도 회전 적용")
                            elif orientation == 8:
                                img = img.rotate(90, expand=True)
                                logger.info("이미지 90도 회전 적용")
                    except Exception as exif_error:
                        logger.warning(f"EXIF 정보 처리 실패: {exif_error}")
                    
                    # 가로/세로 비율 확인 및 가로 사진 처리
                    width, height = img.size
                    is_landscape = width > height
                    
                    # 가로 사진인 경우 90도 회전하여 세로로 표시
                    if is_landscape:
                        img = img.rotate(90, expand=True)
                        logger.info(f"가로 사진을 90도 회전하여 세로로 변환: {img.size}")
                    
                    # 이미지 크기 제한 (비율 유지하면서 리사이즈)
                    max_size = (1920, 1080)
                    if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
                        # 비율을 유지하면서 리사이즈
                        img.thumbnail(max_size, Image.Resampling.LANCZOS)
                        logger.info(f"이미지 리사이즈 완료: {img.size}")
                    
                    # 리사이즈된 이미지를 메모리에 저장
                    img_buffer = io.BytesIO()
                    img.save(img_buffer, format="JPEG", quality=85)
                    img_buffer.seek(0)
                    
                    # 메모리에서 이미지 데이터 추출
                    processed_image_data = img_buffer.getvalue()
                    
            except Exception as img_error:
                logger.error(f"이미지 처리 실패: {img_error}")
                yield f"data: {json.dumps({'error': '이미지 파일 오류입니다.', 'request_id': request_id})}\n\n"
                return

            # 메시지 구성 - 메모리 데이터 사용
            messages = [
                {
                    "role": "system",
                    "content": [
                        {"type": "text", "text": "당신은 뉴스 기자 입니다. 이미지를 통해 상세히 기사를 작성해주세요."}
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "url": f"data:image/jpeg;base64,{base64.b64encode(processed_image_data).decode()}"},
                        {"type": "text", "text": f"이 이미지의 주제가 무엇인가요? 부연설명 : {submessage}"}
                    ]
                }
            ]

            # 방향 정보가 포함된 경우 프롬프트 개선
            if "촬영 방향:" in submessage:
                # 방향 정보 추출
                orientation_match = None
                if "촬영 방향: landscape" in submessage:
                    orientation_match = "가로 방향으로 촬영된 이미지입니다. 가로 화면의 특성을 고려하여 기사를 작성해주세요."
                elif "촬영 방향: portrait" in submessage:
                    orientation_match = "세로 방향으로 촬영된 이미지입니다. 세로 화면의 특성을 고려하여 기사를 작성해주세요."
                
                if orientation_match:
                    # 시스템 메시지에 방향 정보 추가
                    messages[0]["content"][0]["text"] += f" {orientation_match}"
                    logger.info(f"방향 정보 추가됨: {orientation_match}")

            logger.info("스트리밍 AI 모델 실행 시작")
            
            # 즉시 시작 신호 전송
            yield f"data: {json.dumps({'status': 'started', 'message': 'AI 모델이 이미지를 분석하기 시작했습니다...', 'request_id': request_id})}\n\n"
            await asyncio.sleep(0.1)
            
            # 진행 상태 업데이트
            yield f"data: {json.dumps({'status': 'processing', 'message': '이미지에서 특징을 추출하고 있습니다...', 'request_id': request_id})}\n\n"
            await asyncio.sleep(0.5)
            
            yield f"data: {json.dumps({'status': 'processing', 'message': 'AI가 기사를 생성하고 있습니다...', 'request_id': request_id})}\n\n"
            await asyncio.sleep(0.5)
            
            # 스트리밍 텍스트 생성
            generated_text = ""
            text_chunks = []
            
            def stream_callback(text):
                nonlocal generated_text, text_chunks
                generated_text += text
                text_chunks.append(text)
                logger.info(f"스트리밍 콜백: {text}")
            
            # TextStreamer 설정
            streamer = TextStreamer(
                tokenizer=pipe.tokenizer,
                skip_prompt=True,
                skip_special_tokens=True,
                callback=stream_callback
            )
            
            # 모델 실행 (스트리밍)
            logger.info("모델 실행 시작")
            
            # ImageTextToTextPipeline의 __call__ 메서드 사용
            output = pipe(
                text=messages, 
                max_new_tokens=1000,
                streamer=streamer
            )
            
            logger.info("모델 실행 완료")
            
            # 만약 TextStreamer가 작동하지 않았다면, 결과를 수동으로 청크로 나누어 전송
            if len(text_chunks) == 0:
                logger.info("TextStreamer가 작동하지 않음, 수동으로 청크 생성")
                article = output[0]["generated_text"][-1]["content"]
                
                # 더 자연스러운 스트리밍을 위해 단어 단위로 나누기
                words = article.split()
                current_chunk = ""
                chunk_size = 0
                max_chunk_size = 50  # 한 번에 보낼 단어 수
                
                for i, word in enumerate(words):
                    current_chunk += word + " "
                    chunk_size += 1
                    
                    # 문장 끝이나 청크 크기 제한에 도달하면 전송
                    if (word.endswith('.') or word.endswith('!') or word.endswith('?') or 
                        word.endswith('다.') or word.endswith('요.') or word.endswith('죠.') or
                        chunk_size >= max_chunk_size or i == len(words) - 1):
                        
                        if current_chunk.strip():
                            logger.info(f"수동 청크 {len(text_chunks) + 1}: {current_chunk.strip()}")
                            yield f"data: {json.dumps({'text': current_chunk.strip() + ' ', 'request_id': request_id})}\n\n"
                            await asyncio.sleep(0.15)  # 0.15초 지연
                        
                        current_chunk = ""
                        chunk_size = 0
            else:
                # 스트리밍 응답 - 콜백에서 수집된 텍스트 청크들을 전송
                logger.info(f"수집된 텍스트 청크 수: {len(text_chunks)}")
                for i, chunk in enumerate(text_chunks):
                    if chunk.strip():  # 빈 문자열이 아닌 경우만 전송
                        logger.info(f"스트리밍 청크 {i+1}: {chunk}")
                        yield f"data: {json.dumps({'text': chunk, 'request_id': request_id})}\n\n"
                        await asyncio.sleep(0.1)  # 0.1초 지연
            
            # 완료 신호
            logger.info("스트리밍 완료")
            
            # 최종 기사 텍스트 추출
            final_article = generated_text if generated_text else output[0]["generated_text"][-1]["content"]
            
            # 데이터베이스에 기사 저장
            location_info = ""
            orientation_info = ""
            
            # submessage에서 위치 및 방향 정보 추출
            if "촬영 위치:" in submessage:
                location_start = submessage.find("촬영 위치:") + 6
                location_end = submessage.find(")", location_start)
                if location_end > location_start:
                    location_info = submessage[location_start:location_end].strip()
            
            if "촬영 방향:" in submessage:
                orientation_start = submessage.find("촬영 방향:") + 6
                orientation_end = submessage.find(",", orientation_start)
                if orientation_end > orientation_start:
                    orientation_info = submessage[orientation_start:orientation_end].strip()
            
            # 데이터베이스에 저장
            save_success = save_article_to_db(
                request_id=request_id,
                content=final_article,
                image_data=processed_image_data,
                submessage=submessage,
                location=location_info,
                orientation=orientation_info
            )
            
            logger.info("완료 신호 전송: {'status': 'completed', 'request_id': '%s', 'saved_to_db': %s}", request_id, save_success)
            yield f"data: {json.dumps({'status': 'completed', 'request_id': request_id, 'saved_to_db': save_success})}\n\n"
            
        except Exception as e:
            logger.error(f"스트리밍 분석 중 오류: {str(e)}")
            yield f"data: {json.dumps({'error': str(e), 'request_id': request_id})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

if __name__ == "__main__":
    logger.info("Gemma-3n 백엔드 서버 시작")
    uvicorn.run("gemma3n_backend:app", host="0.0.0.0", port=8000, reload=True) 