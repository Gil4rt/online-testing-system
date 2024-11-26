from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, JSON, Table
from sqlalchemy.orm import relationship
from .database import Base
import datetime

# Связующая таблица для отношения многие-ко-многим между тестами и категориями
test_categories = Table('test_categories', Base.metadata,
    Column('test_id', Integer, ForeignKey('tests.id')),
    Column('category_id', Integer, ForeignKey('categories.id'))
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # student, teacher, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Отношения
    created_tests = relationship("Test", back_populates="creator")
    test_results = relationship("TestResult", back_populates="user")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    
    tests = relationship("Test", secondary=test_categories, back_populates="categories")

class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    time_limit = Column(Integer)  # в минутах
    creator_id = Column(Integer, ForeignKey("users.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Отношения
    creator = relationship("User", back_populates="created_tests")
    questions = relationship("Question", back_populates="test", cascade="all, delete-orphan")
    categories = relationship("Category", secondary=test_categories, back_populates="tests")
    test_results = relationship("TestResult", back_populates="test")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"))
    question_text = Column(Text)
    question_type = Column(String)  # multiple_choice, open_ended, etc.
    options = Column(JSON)  # для вопросов с вариантами ответов
    correct_answer = Column(JSON)  # может содержать один или несколько правильных ответов
    points = Column(Integer, default=1)

    # Отношения
    test = relationship("Test", back_populates="questions")
    answers = relationship("Answer", back_populates="question")

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Integer)
    max_score = Column(Integer)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime)

    # Отношения
    test = relationship("Test", back_populates="test_results")
    user = relationship("User", back_populates="test_results")
    answers = relationship("Answer", back_populates="test_result")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, index=True)
    test_result_id = Column(Integer, ForeignKey("test_results.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    answer_content = Column(JSON)
    is_correct = Column(Boolean)
    points_earned = Column(Integer)

    # Отношения
    test_result = relationship("TestResult", back_populates="answers")
    question = relationship("Question", back_populates="answers")
