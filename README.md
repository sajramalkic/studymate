# StudyMate

StudyMate is a learning platform built for students who want to turn their own study materials into useful, structured learning content. It brings material management, AI-assisted studying and peer discussion into one place, making it easier to work through course content and learn with others.

## Demo

A short walkthrough of the application is available here:

[Watch the StudyMate demo](./docs/studymate-demo.mp4)

## What StudyMate offers

- Uploading and organizing personal study materials
- Generating summaries, questions, flashcards and quizzes from uploaded content
- Comment threads and nested replies for discussion and feedback between users
- Email notification after a successful sign-in

## Technology

The frontend is built with React, TypeScript and Vite. The backend uses ASP.NET Core, Entity Framework Core and PostgreSQL, with ASP.NET Core Identity for user accounts. AI-generated study content is powered by the Gemini API, while email notifications are sent through SMTP.

## Running the project locally

### Requirements

- .NET 8 SDK
- Node.js and npm
- PostgreSQL
- Gemini API credentials
- SMTP credentials for email notifications

### Backend

```bash
cd backend
dotnet restore
dotnet ef database update
dotnet run
```

Before starting the API, configure the database connection, Gemini API credentials and SMTP settings through environment variables, .NET User Secrets or your local configuration file. Sensitive values should not be committed to the repository.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The development client runs at `http://localhost:5173`, while the API is configured to run at `http://localhost:5132`.

## Project structure

```text
studymate/
├── backend/     ASP.NET Core Web API
├── frontend/    React and TypeScript client
└── docs/        Demo video and project media
```

## Author

Developed by Sajra Malkić.
