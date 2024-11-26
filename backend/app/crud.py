from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from . import models, schemas
from .security import get_password_hash
from typing import List, Optional
from fastapi import HTTPException
import pandas as pd
from datetime import datetime

# User operations
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        role=user.role,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Category operations
def create_category(db: Session, category: schemas.CategoryCreate):
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_categories(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Category).offset(skip).limit(limit).all()

# Test operations
def create_test(db: Session, test: schemas.TestCreate, creator_id: int):
    # Create the test
    db_test = models.Test(**test.dict(exclude={'category_ids', 'questions'}), creator_id=creator_id)
    
    # Add categories
    categories = db.query(models.Category).filter(
        models.Category.id.in_(test.category_ids)
    ).all()
    db_test.categories = categories
    
    db.add(db_test)
    db.commit()
    db.refresh(db_test)

    # Create questions
    for question in test.questions:
        question.test_id = db_test.id
        create_question(db, question)
    
    db.refresh(db_test)
    return db_test

def get_test(db: Session, test_id: int):
    return db.query(models.Test).options(joinedload(models.Test.questions)).filter(models.Test.id == test_id).first()

def get_tests(db: Session, skip: int = 0, limit: int = 100, category_id: Optional[int] = None):
    query = db.query(models.Test)
    if category_id:
        query = query.filter(models.Test.categories.any(id=category_id))
    return query.offset(skip).limit(limit).all()

# Question operations
def create_question(db: Session, question: schemas.QuestionCreate):
    db_question = models.Question(**question.dict())
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

def get_questions_by_test(db: Session, test_id: int):
    return db.query(models.Question).filter(models.Question.test_id == test_id).all()

# Test result operations
def create_test_result(db: Session, test_result: schemas.TestResultCreate):
    db_test_result = models.TestResult(**test_result.dict())
    db.add(db_test_result)
    db.commit()
    db.refresh(db_test_result)
    return db_test_result

def get_test_results(db: Session, user_id: Optional[int] = None, test_id: Optional[int] = None):
    query = db.query(models.TestResult)
    if user_id:
        query = query.filter(models.TestResult.user_id == user_id)
    if test_id:
        query = query.filter(models.TestResult.test_id == test_id)
    return query.all()

def submit_answer(db: Session, answer: schemas.AnswerCreate):
    # Get the question to check the answer
    question = db.query(models.Question).filter(models.Question.id == answer.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if the answer is correct
    is_correct = False
    points_earned = 0
    
    if question.question_type == "multiple_choice":
        is_correct = set(answer.answer_content) == set(question.correct_answer)
    else:  # Для других типов вопросов можно добавить свою логику проверки
        is_correct = answer.answer_content == question.correct_answer
    
    if is_correct:
        points_earned = question.points
    
    # Create the answer record
    db_answer = models.Answer(
        test_result_id=answer.test_result_id,
        question_id=answer.question_id,
        answer_content=answer.answer_content,
        is_correct=is_correct,
        points_earned=points_earned
    )
    
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    return db_answer

def complete_test(db: Session, test_result_id: int):
    test_result = db.query(models.TestResult).filter(models.TestResult.id == test_result_id).first()
    if not test_result:
        raise HTTPException(status_code=404, detail="Test result not found")
    
    # Calculate total score
    answers = db.query(models.Answer).filter(models.Answer.test_result_id == test_result_id).all()
    score = sum(answer.points_earned for answer in answers)
    
    # Calculate max possible score
    questions = db.query(models.Question).filter(models.Question.test_id == test_result.test_id).all()
    max_score = sum(question.points for question in questions)
    
    # Update test result
    test_result.score = score
    test_result.max_score = max_score
    test_result.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(test_result)
    return test_result

def import_test_from_excel(db: Session, file_path: str, creator_id: int, category_ids: List[int]):
    try:
        # Чтение Excel файла
        df = pd.read_excel(file_path)
        
        # Создание теста
        test_data = {
            "title": df.iloc[0]["Test Title"],
            "description": df.iloc[0]["Test Description"],
            "time_limit": int(df.iloc[0]["Time Limit"]) if "Time Limit" in df.columns else None,
            "category_ids": category_ids
        }
        test = schemas.TestCreate(**test_data)
        db_test = create_test(db, test, creator_id)
        
        # Создание вопросов
        for _, row in df.iterrows():
            if pd.isna(row["Question"]):
                continue
                
            question_data = {
                "test_id": db_test.id,
                "question_text": row["Question"],
                "question_type": row["Question Type"],
                "options": row["Options"].split("|") if "Options" in row and pd.notna(row["Options"]) else None,
                "correct_answer": row["Correct Answer"].split("|") if row["Question Type"] == "multiple_choice" else row["Correct Answer"],
                "points": int(row["Points"]) if "Points" in row and pd.notna(row["Points"]) else 1
            }
            question = schemas.QuestionCreate(**question_data)
            create_question(db, question)
            
        return db_test
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error importing test from Excel: {str(e)}")
