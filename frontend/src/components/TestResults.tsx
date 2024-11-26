import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Divider,
    Chip,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { TestResult, Question, Answer } from '../types';
import * as api from '../services/api';

interface DetailedTestResult extends TestResult {
    questions: (Question & { userAnswer?: Answer })[];
}

const TestResults: React.FC = () => {
    const { resultId } = useParams<{ resultId: string }>();
    const [testResult, setTestResult] = useState<DetailedTestResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTestResult = async () => {
            try {
                if (!resultId) return;
                const result = await api.getTestResult(parseInt(resultId));
                if (result && result.test) {
                    setTestResult(result as DetailedTestResult);
                }
            } catch (error) {
                console.error('Error fetching test result:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTestResult();
    }, [resultId]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (!testResult) {
        return <Typography>Результаты не найдены</Typography>;
    }

    const calculatePercentage = (score: number, totalPoints: number) => {
        return Math.round((score / totalPoints) * 100);
    };

    const totalPoints = testResult.questions.reduce(
        (sum, question) => sum + question.points,
        0
    );
    const percentage = calculatePercentage(testResult.score || 0, totalPoints);

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Результаты теста: {testResult.test?.title}
                </Typography>

                <Box sx={{ my: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Общий результат
                    </Typography>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            mb: 2,
                        }}
                    >
                        <Typography variant="body1">
                            Баллы: {testResult.score} из {totalPoints}
                        </Typography>
                        <Chip
                            label={`${percentage}%`}
                            color={percentage >= 70 ? 'success' : 'error'}
                        />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                        Время выполнения: {Math.floor(testResult.completion_time / 60)} мин{' '}
                        {testResult.completion_time % 60} сек
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                    Детальный разбор
                </Typography>

                <List>
                    {testResult.questions.map((question, index) => (
                        <React.Fragment key={question.id}>
                            <ListItem
                                alignItems="flex-start"
                                sx={{
                                    flexDirection: 'column',
                                    backgroundColor:
                                        question.userAnswer?.is_correct
                                            ? 'rgba(76, 175, 80, 0.1)'
                                            : 'rgba(244, 67, 54, 0.1)',
                                    borderRadius: 1,
                                    mb: 2,
                                }}
                            >
                                <Box sx={{ width: '100%', mb: 1 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Вопрос {index + 1}:{' '}
                                        <Chip
                                            size="small"
                                            label={`${question.points} баллов`}
                                            sx={{ ml: 1 }}
                                        />
                                    </Typography>
                                    <Typography variant="body1" gutterBottom>
                                        {question.question_text}
                                    </Typography>
                                </Box>

                                {question.question_type === 'multiple_choice' && (
                                    <Box sx={{ width: '100%', ml: 2 }}>
                                        <Typography variant="body2" color="textSecondary">
                                            Варианты ответов:
                                        </Typography>
                                        <List dense>
                                            {question.options?.map((option, optIndex) => (
                                                <ListItem key={optIndex} dense>
                                                    <ListItemText
                                                        primary={option}
                                                        sx={{
                                                            color:
                                                                option === question.correct_answer
                                                                    ? 'success.main'
                                                                    : option ===
                                                                      question.userAnswer
                                                                          ?.answer_content
                                                                    ? 'error.main'
                                                                    : 'inherit',
                                                        }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                )}

                                <Box sx={{ width: '100%', mt: 1 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        Ваш ответ:
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        color={
                                            question.userAnswer?.is_correct
                                                ? 'success.main'
                                                : 'error.main'
                                        }
                                    >
                                        {question.userAnswer?.answer_content || 'Нет ответа'}
                                    </Typography>

                                    {!question.userAnswer?.is_correct && (
                                        <Box sx={{ mt: 1 }}>
                                            <Typography variant="body2" color="textSecondary">
                                                Правильный ответ:
                                            </Typography>
                                            <Typography variant="body1" color="success.main">
                                                {question.correct_answer}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </ListItem>
                            {index < testResult.questions.length - 1 && (
                                <Divider sx={{ my: 2 }} />
                            )}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
        </Box>
    );
};

export default TestResults;
