export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface Category {
    id: number;
    name: string;
    description?: string;
}

export interface Question {
    id?: number;
    test_id?: number;
    question_text: string;
    question_type: 'multiple_choice' | 'open_ended';
    options?: string[];
    correct_answer: string;
    points: number;
}

export interface Test {
    id: number;
    title: string;
    description: string;
    time_limit: number;
    creator_id: number;
    category_ids: number[];
    categories?: Category[];
    questions: Question[];
}

export interface Answer {
    id?: number;
    question_id: number;
    test_result_id: number;
    answer_content: string;
    is_correct?: boolean;
}

export interface TestResult {
    id: number;
    user_id: number;
    test_id: number;
    score: number;
    completion_time: number;
    completed: boolean;
    test?: Test;
}

export interface DetailedTestResult extends TestResult {
    test: Test;
    questions: (Question & { userAnswer?: Answer })[];
}
