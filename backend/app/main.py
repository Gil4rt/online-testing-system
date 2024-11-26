from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import timedelta
import os
import tempfile

from . import crud, models, schemas, security
from .database import SessionLocal, engine, Base

# Создаем таблицы в базе данных
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Test Platform API")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене указать конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth endpoints
@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_username(db, form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# User endpoints
@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me/", response_model=schemas.User)
async def read_users_me(
    current_user = Depends(security.get_current_active_user)
):
    return current_user

@app.get("/users/", response_model=List[schemas.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    users = crud.get_users(db, skip=skip, limit=limit)
    return users

# Category endpoints
@app.post("/categories/", response_model=schemas.Category)
def create_category(
    category: schemas.CategoryCreate,
    current_user = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return crud.create_category(db=db, category=category)

@app.get("/categories/", response_model=List[schemas.Category])
def read_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    categories = crud.get_categories(db, skip=skip, limit=limit)
    return categories

# Test endpoints
@app.post("/tests/", response_model=schemas.Test)
def create_test(
    test: schemas.TestCreate,
    current_user = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return crud.create_test(db=db, test=test, creator_id=current_user.id)

@app.get("/tests/", response_model=List[schemas.Test])
def read_tests(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(security.get_current_active_user)
):
    tests = crud.get_tests(db, skip=skip, limit=limit, category_id=category_id)
    return tests

@app.get("/tests/{test_id}", response_model=schemas.Test)
def read_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(security.get_current_active_user)
):
    test = crud.get_test(db, test_id=test_id)
    if test is None:
        raise HTTPException(status_code=404, detail="Test not found")
    return test

# Question endpoints
@app.post("/questions/", response_model=schemas.Question)
def create_question(
    question: schemas.QuestionCreate,
    current_user = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return crud.create_question(db=db, question=question)

@app.get("/tests/{test_id}/questions/", response_model=List[schemas.Question])
def read_test_questions(
    test_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(security.get_current_active_user)
):
    questions = crud.get_questions_by_test(db, test_id=test_id)
    return questions

# Test results endpoints
@app.post("/test-results/", response_model=schemas.TestResult)
def create_test_result(
    test_result: schemas.TestResultCreate,
    current_user = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.create_test_result(db=db, test_result=test_result)

@app.post("/test-results/{test_result_id}/submit-answer/", response_model=schemas.Answer)
def submit_test_answer(
    test_result_id: int,
    answer: schemas.AnswerCreate,
    current_user = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Проверяем, принадлежит ли test_result текущему пользователю
    test_result = crud.get_test_results(db, user_id=current_user.id, test_id=answer.test_result_id)
    if not test_result:
        raise HTTPException(status_code=403, detail="Not authorized to submit answer for this test")
    return crud.submit_answer(db=db, answer=answer)

@app.post("/test-results/{test_result_id}/complete/", response_model=schemas.TestResult)
def complete_test_result(
    test_result_id: int,
    current_user = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    return crud.complete_test(db=db, test_result_id=test_result_id)

@app.get("/test-results/", response_model=List[schemas.TestResult])
def read_test_results(
    test_id: Optional[int] = None,
    user_id: Optional[int] = None,
    current_user = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    # Проверяем права доступа
    if current_user.role not in ["admin", "teacher"]:
        # Студенты могут видеть только свои результаты
        user_id = current_user.id
    return crud.get_test_results(db, user_id=user_id, test_id=test_id)

# Excel import endpoint
@app.post("/tests/import-excel/", response_model=schemas.Test)
async def import_test_from_excel(
    file: UploadFile = File(...),
    category_ids: List[int] = [],
    current_user = Depends(security.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    # Сохраняем файл во временную директорию
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx")
    try:
        contents = await file.read()
        with open(temp_file.name, 'wb') as f:
            f.write(contents)
            
        # Импортируем тест
        test = crud.import_test_from_excel(
            db=db,
            file_path=temp_file.name,
            creator_id=current_user.id,
            category_ids=category_ids
        )
        return test
    finally:
        os.unlink(temp_file.name)  # Удаляем временный файл
