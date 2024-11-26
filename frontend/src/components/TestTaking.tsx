import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Typography,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
} from '@mui/material';
import * as api from '../services/api';
import { Test, TestResult, Question } from '../types';

const TestTaking: React.FC = () => {
    const { testId } = useParams<{ testId: string }>();
    const navigate = useNavigate();
    const [test, setTest] = useState<Test | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        const fetchTest = async () => {
            try {
                if (!testId) {
                    setLoading(false);
                    return;
                }
                console.log('Fetching test with ID:', testId);
                
                const fetchedTest = await api.getTest(parseInt(testId));
                console.log('Fetched test (full):', JSON.stringify(fetchedTest, null, 2));
                setTest(fetchedTest);
                
                // Начинаем тест
                console.log('Starting test...');
                const result = await api.startTest(parseInt(testId));
                console.log('Test started (full):', JSON.stringify(result, null, 2));
                setTestResult(result);
                
                // Устанавливаем таймер
                if (fetchedTest.time_limit) {
                    console.log('Setting timer:', fetchedTest.time_limit);
                    setTimeLeft(fetchedTest.time_limit * 60);
                }

                // Проверяем вопросы
                if (fetchedTest.questions && fetchedTest.questions.length > 0) {
                    console.log('Current question:', fetchedTest.questions[currentQuestionIndex]);
                } else {
                    console.warn('No questions found in the test!');
                }
            } catch (error) {
                console.error('Error in test taking flow:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTest();
    }, [testId, currentQuestionIndex]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null || prev <= 0) {
                    clearInterval(timer);
                    handleComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (questionId: number, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleNextQuestion = async () => {
        if (!test || !testResult || !currentQuestion?.id) return;

        // Сохраняем ответ на текущий вопрос
        try {
            await api.submitAnswer(testResult.id, {
                question_id: currentQuestion.id,
                test_result_id: testResult.id,
                answer_content: answers[currentQuestion.id] || ''
            });
        } catch (error) {
            console.error('Error submitting answer:', error);
        }

        if (currentQuestionIndex < test.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        } else {
            setShowConfirmDialog(true);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
        }
    };

    const handleComplete = async () => {
        try {
            if (!testResult) return;
            await api.completeTest(testResult.id);
            navigate(`/test-results/${testResult.id}`);
        } catch (error) {
            console.error('Error completing test:', error);
        }
    };

    const currentQuestion = test?.questions?.[currentQuestionIndex];
    
    useEffect(() => {
        console.log('Current question changed:', currentQuestion);
    }, [currentQuestion]);

    if (loading || !test) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!test.questions || test.questions.length === 0) {
        return (
            <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', textAlign: 'center' }}>
                <Typography variant="h4" gutterBottom>
                    {test.title}
                </Typography>
                <Typography variant="h6" color="error" gutterBottom>
                    В этом тесте пока нет вопросов.
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/tests')}
                    sx={{ mt: 2 }}
                >
                    Вернуться к списку тестов
                </Button>
            </Box>
        );
    }

    if (!currentQuestion?.id) {
        return <CircularProgress />;
    }

    const questionId = currentQuestion.id; // Store the ID to ensure type safety

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                {test.title}
            </Typography>

            {timeLeft !== null && (
                <Typography variant="h6" gutterBottom color={timeLeft < 60 ? 'error' : 'inherit'}>
                    Оставшееся время: {formatTime(timeLeft)}
                </Typography>
            )}

            <Box sx={{ my: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Вопрос {currentQuestionIndex + 1} из {test.questions.length}
                </Typography>
                <Typography variant="body1" gutterBottom>
                    {currentQuestion.question_text}
                </Typography>

                <Box sx={{ mt: 3 }}>
                    {currentQuestion.question_type === 'multiple_choice' ? (
                        <FormControl component="fieldset">
                            <FormLabel component="legend">Выберите ответ:</FormLabel>
                            <RadioGroup
                                value={answers[questionId] ?? ''}
                                onChange={(e) =>
                                    handleAnswerChange(questionId, e.target.value)
                                }
                            >
                                {currentQuestion.options?.map((option, index) => (
                                    <FormControlLabel
                                        key={index}
                                        value={option}
                                        control={<Radio />}
                                        label={option}
                                    />
                                ))}
                            </RadioGroup>
                        </FormControl>
                    ) : (
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            value={answers[questionId] ?? ''}
                            onChange={(e) =>
                                handleAnswerChange(questionId, e.target.value)
                            }
                            placeholder="Введите ваш ответ"
                        />
                    )}
                </Box>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        variant="outlined"
                        onClick={handlePrevQuestion}
                        disabled={currentQuestionIndex === 0}
                    >
                        Назад
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleNextQuestion}
                        disabled={!answers[questionId]}
                    >
                        {currentQuestionIndex === test.questions.length - 1
                            ? 'Завершить'
                            : 'Следующий'}
                    </Button>
                </Box>
            </Box>

            <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
                <DialogTitle>Завершить тест?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите завершить тест? После завершения вы не сможете изменить свои ответы.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowConfirmDialog(false)}>Отмена</Button>
                    <Button onClick={handleComplete} variant="contained">
                        Завершить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TestTaking;
