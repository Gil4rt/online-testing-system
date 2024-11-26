# Test Platform

Платформа для создания и проведения онлайн-тестирования с поддержкой различных типов вопросов и ролей пользователей.

## Возможности

- Создание и управление тестами
- Различные типы вопросов (множественный выбор, открытые вопросы)
- Система ролей (администратор, преподаватель, студент)
- Импорт тестов из Excel
- Просмотр результатов тестирования
- API для интеграции с другими системами

## Требования

- Python 3.8+
- PostgreSQL 12+
- Node.js 14+

## Установка

### Использование Docker (рекомендуется)

1. Клонируйте репозиторий:
```bash
git clone [repository-url]
cd test-platform
```

2. Скопируйте файл с переменными окружения:
```bash
cp .env.template .env
```
Отредактируйте `.env` файл, указав необходимые значения.

3. Запустите приложение с помощью Docker Compose:
```bash
docker-compose up -d
```

Приложение будет доступно по адресам:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Локальная установка

1. Клонируйте репозиторий:
```bash
git clone [repository-url]
cd test-platform
```

2. Создайте и активируйте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

4. Создайте базу данных PostgreSQL:
```sql
CREATE DATABASE test_platform;
```

5. Настройте переменные окружения:
- Скопируйте файл `.env.example` в `.env`
- Укажите правильные значения для переменных окружения

## Запуск

1. Запустите бэкенд:
```bash
cd backend
uvicorn app.main:app --reload
```

2. Запустите фронтенд:
```bash
cd frontend
npm install
npm start
```

## Структура проекта

```
test-platform/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── crud.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   └── security.py
│   └── tests/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── requirements.txt
└── README.md
```

## API Документация

После запуска сервера, документация API доступна по адресу:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Формат Excel файла для импорта тестов

Excel файл должен содержать следующие колонки:
- Test Title
- Test Description
- Time Limit (в минутах)
- Question
- Question Type (multiple_choice/open_ended)
- Options (варианты ответов, разделенные |)
- Correct Answer
- Points

## Безопасность

- Используется JWT для аутентификации
- Пароли хешируются с использованием bcrypt
- Реализовано разграничение прав доступа
- CORS настроен для безопасности

## Разработка

1. Создайте новую ветку для разработки:
```bash
git checkout -b feature/your-feature-name
```

2. Внесите изменения и создайте коммит:
```bash
git add .
git commit -m "Add your feature description"
```

3. Отправьте изменения в репозиторий:
```bash
git push origin feature/your-feature-name
```

## Тестирование

Для запуска тестов выполните:
```bash
pytest
```

## Лицензия

MIT
