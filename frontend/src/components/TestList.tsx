import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    Button,
    CircularProgress,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from '@mui/material';
import { Test, Category } from '../types';
import * as api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const TestList: React.FC = () => {
    const [tests, setTests] = useState<Test[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [testsData, categoriesData] = await Promise.all([
                    api.getTests(),
                    api.getCategories(),
                ]);
                setTests(testsData.filter(test => 
                    !selectedCategory || test.category_ids.includes(Number(selectedCategory))
                ));
                setCategories(categoriesData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedCategory]);

    const handleCategoryChange = (event: any) => {
        setSelectedCategory(event.target.value);
    };

    const handleStartTest = (testId: number) => {
        navigate(`/tests/${testId}`);
    };

    const handleCreateTest = () => {
        navigate('/tests/create');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4" component="h1">
                    Доступные тесты
                </Typography>
                {user?.role !== 'student' && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreateTest}
                    >
                        Создать тест
                    </Button>
                )}
            </Box>

            <FormControl sx={{ mb: 3, minWidth: 200 }}>
                <InputLabel id="category-select-label">Категория</InputLabel>
                <Select
                    labelId="category-select-label"
                    id="category-select"
                    value={selectedCategory}
                    label="Категория"
                    onChange={handleCategoryChange}
                >
                    <MenuItem value="">
                        <em>Все категории</em>
                    </MenuItem>
                    {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                            {category.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Grid container spacing={3}>
                {tests.map((test) => (
                    <Grid item xs={12} sm={6} md={4} key={test.id}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" component="h2" gutterBottom>
                                    {test.title}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    sx={{ mb: 2 }}
                                >
                                    {test.description}
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    {test.categories?.map((category) => (
                                        <Chip
                                            key={category.id}
                                            label={category.name}
                                            sx={{ mr: 1, mb: 1 }}
                                        />
                                    ))}
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {test.time_limit
                                            ? `Время: ${test.time_limit} мин`
                                            : 'Без ограничения времени'}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleStartTest(test.id)}
                                    >
                                        {user?.role === 'student' ? 'Начать тест' : 'Просмотреть'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default TestList;
