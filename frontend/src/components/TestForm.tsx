import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    FormHelperText,
    Chip,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useFormik, FormikErrors } from 'formik';
import * as yup from 'yup';
import { Test, Category } from '../types';
import * as api from '../services/api';
import { useNavigate } from 'react-router-dom';

const validationSchema = yup.object({
    title: yup.string().required('Название теста обязательно'),
    description: yup.string(),
    time_limit: yup.number().min(0, 'Время не может быть отрицательным'),
    category_ids: yup.array().of(yup.number()).min(1, 'Выберите хотя бы одну категорию'),
    questions: yup.array().of(
        yup.object({
            question_text: yup.string().required('Текст вопроса обязателен'),
            question_type: yup.string().required('Тип вопроса обязателен'),
            options: yup.array().when(['question_type'], (values: any) => {
                const [questionType] = values;
                return questionType === 'multiple_choice'
                    ? yup.array().required().min(2, 'Добавьте хотя бы 2 варианта ответа')
                    : yup.array().notRequired();
            }),
            correct_answer: yup.mixed().required('Укажите правильный ответ'),
            points: yup.number().min(1, 'Минимум 1 балл').required('Укажите количество баллов'),
        })
    ).min(1, 'Добавьте хотя бы один вопрос'),
});

interface Question {
    question_text: string;
    question_type: 'multiple_choice' | 'open_ended';
    options?: string[];
    correct_answer: string | string[];
    points: number;
}

const TestForm: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await api.getCategories();
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        fetchCategories();
    }, []);

    const formik = useFormik({
        initialValues: {
            title: '',
            description: '',
            time_limit: 0,
            category_ids: [] as number[],
            questions: [] as Question[],
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            try {
                const test = await api.createTest({
                    title: values.title,
                    description: values.description,
                    time_limit: values.time_limit,
                    category_ids: values.category_ids,
                    questions: values.questions.map(q => ({
                        ...q,
                        correct_answer: typeof q.correct_answer === 'string' ? q.correct_answer : q.correct_answer[0]
                    }))
                });
                navigate('/tests');
            } catch (error) {
                console.error('Error creating test:', error);
            }
        },
    });

    const handleAddQuestion = () => {
        formik.setFieldValue('questions', [
            ...formik.values.questions,
            {
                question_text: '',
                question_type: 'multiple_choice',
                options: ['', ''],
                correct_answer: [],
                points: 1,
            },
        ]);
    };

    const handleRemoveQuestion = (index: number) => {
        const questions = [...formik.values.questions];
        questions.splice(index, 1);
        formik.setFieldValue('questions', questions);
    };

    const handleAddOption = (questionIndex: number) => {
        const questions = [...formik.values.questions];
        questions[questionIndex].options = [...(questions[questionIndex].options || []), ''];
        formik.setFieldValue('questions', questions);
    };

    const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
        const questions = [...formik.values.questions];
        questions[questionIndex].options?.splice(optionIndex, 1);
        formik.setFieldValue('questions', questions);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    Создание теста
                </Typography>
                <form onSubmit={formik.handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="title"
                                name="title"
                                label="Название теста"
                                value={formik.values.title}
                                onChange={formik.handleChange}
                                error={formik.touched.title && Boolean(formik.errors.title)}
                                helperText={formik.touched.title && formik.errors.title}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                id="description"
                                name="description"
                                label="Описание"
                                multiline
                                rows={3}
                                value={formik.values.description}
                                onChange={formik.handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                id="time_limit"
                                name="time_limit"
                                label="Ограничение по времени (минуты)"
                                type="number"
                                value={formik.values.time_limit}
                                onChange={formik.handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth error={Boolean(formik.errors.category_ids)}>
                                <InputLabel>Категории</InputLabel>
                                <Select
                                    multiple
                                    value={formik.values.category_ids}
                                    onChange={formik.handleChange}
                                    name="category_ids"
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                                <Chip
                                                    key={value}
                                                    label={
                                                        categories.find((cat) => cat.id === value)
                                                            ?.name
                                                    }
                                                />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {formik.errors.category_ids && (
                                    <FormHelperText>
                                        {formik.errors.category_ids as string}
                                    </FormHelperText>
                                )}
                            </FormControl>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, mb: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Вопросы
                        </Typography>
                        {formik.values.questions.map((question, questionIndex) => (
                            <Paper key={questionIndex} sx={{ p: 2, mb: 2 }} variant="outlined">
                                <Grid container spacing={2}>
                                    <Grid item xs={11}>
                                        <TextField
                                            fullWidth
                                            label="Текст вопроса"
                                            name={`questions.${questionIndex}.question_text`}
                                            value={question.question_text}
                                            onChange={formik.handleChange}
                                            error={Boolean(
                                                formik.errors.questions?.[questionIndex] &&
                                                typeof formik.errors.questions[questionIndex] === 'object' &&
                                                (formik.errors.questions[questionIndex] as FormikErrors<Question>).question_text
                                            )}
                                            helperText={
                                                typeof formik.errors.questions?.[questionIndex] === 'object' 
                                                ? (formik.errors.questions[questionIndex] as FormikErrors<Question>).question_text
                                                : ''
                                            }
                                        />
                                    </Grid>
                                    <Grid item xs={1}>
                                        <IconButton
                                            onClick={() => handleRemoveQuestion(questionIndex)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Тип вопроса</InputLabel>
                                            <Select
                                                name={`questions.${questionIndex}.question_type`}
                                                value={question.question_type}
                                                onChange={formik.handleChange}
                                            >
                                                <MenuItem value="multiple_choice">
                                                    Множественный выбор
                                                </MenuItem>
                                                <MenuItem value="open_ended">
                                                    Открытый вопрос
                                                </MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            fullWidth
                                            label="Баллы"
                                            type="number"
                                            name={`questions.${questionIndex}.points`}
                                            value={question.points}
                                            onChange={formik.handleChange}
                                        />
                                    </Grid>

                                    {question.question_type === 'multiple_choice' && (
                                        <Grid item xs={12}>
                                            {question.options?.map((option, optionIndex) => (
                                                <Box
                                                    key={optionIndex}
                                                    sx={{ display: 'flex', mb: 1 }}
                                                >
                                                    <TextField
                                                        fullWidth
                                                        label={`Вариант ${optionIndex + 1}`}
                                                        name={`questions.${questionIndex}.options.${optionIndex}`}
                                                        value={option}
                                                        onChange={formik.handleChange}
                                                    />
                                                    <IconButton
                                                        onClick={() =>
                                                            handleRemoveOption(
                                                                questionIndex,
                                                                optionIndex
                                                            )
                                                        }
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Box>
                                            ))}
                                            <Button
                                                startIcon={<AddIcon />}
                                                onClick={() => handleAddOption(questionIndex)}
                                            >
                                                Добавить вариант
                                            </Button>
                                        </Grid>
                                    )}

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Правильный ответ"
                                            name={`questions.${questionIndex}.correct_answer`}
                                            value={
                                                question.question_type === 'multiple_choice'
                                                    ? (question.correct_answer as string[]).join(',')
                                                    : question.correct_answer
                                            }
                                            onChange={(e) => {
                                                const value =
                                                    question.question_type === 'multiple_choice'
                                                        ? e.target.value.split(',')
                                                        : e.target.value;
                                                formik.setFieldValue(
                                                    `questions.${questionIndex}.correct_answer`,
                                                    value
                                                );
                                            }}
                                            helperText={
                                                question.question_type === 'multiple_choice'
                                                    ? 'Введите номера правильных ответов через запятую'
                                                    : 'Введите правильный ответ'
                                            }
                                        />
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))}
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleAddQuestion}
                        >
                            Добавить вопрос
                        </Button>
                    </Box>

                    <Box sx={{ mt: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            type="submit"
                            disabled={formik.isSubmitting}
                        >
                            Создать тест
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default TestForm;
