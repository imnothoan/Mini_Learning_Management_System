# Mini Learning Management System

Mini Learning Management System is a small-scale web application for online learning management. It was built as a foundation project with a complete front-end, back-end service, relational database, authentication, and role-based access control.

## Main Features

- Sign up, sign in, and sign out with Supabase Auth
- Three roles: Administrator, Instructor, and Student
- Students can browse courses, search, enroll, learn from video lessons, and track progress
- Instructors can create, update, delete, and preview courses and lessons
- Administrators can monitor system statistics and update user roles
- Course cover upload through Supabase Storage
- Lesson player with course outline, lesson completion status, and automatic progress calculation
- Database access policies in Supabase to protect role-based data access

## Technology Stack

- React + Vite
- React Router
- Tailwind CSS
- Supabase Auth, PostgreSQL, Storage, and database access policies
- ESLint

## Project Structure

```text
.
├── public/                 # favicon
├── docs/                   # report and defense guide
├── src/
│   ├── components/         # Layout and reusable course card
│   ├── context/            # Authentication context
│   ├── lib/                # Supabase client
│   ├── pages/              # Auth, Dashboard, Courses, Lesson, Admin
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── supabase/schema.sql     # Database schema, access policies, triggers
├── seed.js                 # Demo data seeding script
├── package.json
└── README.md
```

## Environment Setup

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Fill in the required values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
DATABASE_PASSWORD=your_database_password_here
```

Do not commit `.env.local` to GitHub.

## Install and Run

```bash
npm ci
npm run dev
```

Quality checks:

```bash
npm run lint
npm run build
```

## Database Setup

1. Open Supabase SQL Editor.
2. Run the full `supabase/schema.sql` file.
3. Seed demo data:

```bash
node seed.js
```

Demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@example.com | password123 |
| Instructor | instructor@example.com | password123 |
| Student | student@example.com | password123 |

## Suggested Demo Flow

1. Sign in as Administrator to view system statistics and update user roles.
2. Sign in as Instructor to create a course, add lessons, edit course details, and preview learning content.
3. Sign in as Student to search for courses, enroll, watch a lesson, mark lessons as complete, and observe progress updates.
4. Open Supabase to explain the database tables: `profiles`, `courses`, `lessons`, `enrollments`, `lesson_completions`, triggers, and access rules.

## Documentation

- `docs/MiniLMS_Report.md`: full report content with UML-style Mermaid diagrams, ERD, database design, implementation, testing, and defense questions.
- `docs/Defense_Guide_vi.md`: Vietnamese demo script and defense preparation notes.
