import axios from 'axios';
import { User, Test, Category, Question, TestResult, Answer } from '../types';

const API_URL = 'http://localhost:8000';

// Настройка axios
axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth
export const login = async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    
    const response = await axios.post(`${API_URL}/token`, formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
    const response = await axios.get(`${API_URL}/users/me`);
    return response.data;
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
};

export const createCategory = async (category: Partial<Category>): Promise<Category> => {
    const response = await axios.post(`${API_URL}/categories`, category);
    return response.data;
};

// Tests
export const getTests = async (): Promise<Test[]> => {
    const response = await axios.get(`${API_URL}/tests`);
    return response.data;
};

export const getTest = async (id: number): Promise<Test> => {
    const response = await axios.get(`${API_URL}/tests/${id}`);
    return response.data;
};

export const createTest = async (test: Partial<Test>): Promise<Test> => {
    const response = await axios.post(`${API_URL}/tests`, test);
    return response.data;
};

// Questions
export const createQuestion = async (question: Partial<Question>): Promise<Question> => {
    const response = await axios.post(`${API_URL}/questions`, question);
    return response.data;
};

// Test Results
export const startTest = async (testId: number): Promise<TestResult> => {
    const currentUser = await getCurrentUser();
    const response = await axios.post(`${API_URL}/test-results`, { 
        test_id: testId,
        user_id: currentUser.id
    });
    return response.data;
};

export const submitAnswer = async (testResultId: number, answer: Partial<Answer>): Promise<Answer> => {
    const response = await axios.post(`${API_URL}/test-results/${testResultId}/answers`, answer);
    return response.data;
};

export const completeTest = async (testResultId: number): Promise<TestResult> => {
    const response = await axios.post(`${API_URL}/test-results/${testResultId}/complete`);
    return response.data;
};

export const getTestResult = async (testResultId: number): Promise<TestResult> => {
    const response = await axios.get(`${API_URL}/test-results/${testResultId}`);
    return response.data;
};
