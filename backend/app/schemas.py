from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Category schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    
    class Config:
        from_attributes = True

# Question schemas
class QuestionBase(BaseModel):
    question_text: str
    question_type: str
    options: Optional[Any] = None
    correct_answer: Any
    points: int = 1

class QuestionCreate(QuestionBase):
    test_id: int

class Question(QuestionBase):
    id: int
    test_id: int

    class Config:
        from_attributes = True

# Test schemas
class TestBase(BaseModel):
    title: str
    description: Optional[str] = None
    time_limit: Optional[int] = None

class TestCreate(TestBase):
    category_ids: List[int]
    questions: List[QuestionCreate]

    @validator('questions')
    def validate_questions(cls, v):
        if not v:
            raise ValueError('Test must have at least one question')
        return v

class Test(TestBase):
    id: int
    creator_id: int
    is_active: bool
    created_at: datetime
    questions: List[Question]
    categories: List[Category]

    class Config:
        from_attributes = True

# Answer schemas
class AnswerBase(BaseModel):
    answer_content: Any
    
class AnswerCreate(AnswerBase):
    question_id: int
    test_result_id: int

class Answer(AnswerBase):
    id: int
    is_correct: bool
    points_earned: int

    class Config:
        from_attributes = True

# TestResult schemas
class TestResultBase(BaseModel):
    test_id: int
    user_id: int

class TestResultCreate(TestResultBase):
    pass

class TestResult(TestResultBase):
    id: int
    score: Optional[int]
    max_score: Optional[int]
    started_at: datetime
    completed_at: Optional[datetime]
    answers: List[Answer]

    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
