# EduFlow - Institute Management API

Modern Node.js/Express backend for multi-tenant institute management with Prisma + Supabase PostgreSQL.

## Features

- 🔐 User authentication (JWT + OAuth2.0 - Google, Microsoft)
- 🏫 Multi-tenant institute management (Row Level Security)
- 📚 Course, category, teacher, student, and library/book CRUD
- ☁️ Cloud file uploads (Cloudinary)
- 🔒 Role-based access control (5 roles: super-admin, institute, teacher, student, admin)
- 📊 Analytics and reporting
- 📧 Email notifications (Nodemailer)
- 🔐 MFA/2FA support
- 🛡️ Advanced security (rate limiting, SQL injection prevention, XSS protection)

## Tech Stack

- **Runtime**: Node.js 22.x, Express 5.x
- **Language**: TypeScript 5.8
- **Database**: Prisma 7 + Supabase PostgreSQL (with RLS)
- **Authentication**: Jose (JWT), Passport.js (OAuth)
- **File Storage**: Cloudinary
- **Email**: Nodemailer
- **Monitoring**: Sentry, PostHog
- **Deployment**: Render.com

## Architecture

- **Database**: Prisma ORM with Supabase PostgreSQL
  - Connection pooling via Supavisor (port 6543)
  - Row Level Security (RLS) for multi-tenancy
- ~~Legacy MySQL/Sequelize support~~ **REMOVED** (All modules now use Prisma ORM)

## Getting Started

### Prerequisites

- Node.js (v18+ recommended, v22 on production)
- Supabase account (PostgreSQL database)

### Installation

1. Clone the repository:
   ```sh
   git clone <your-repo-url>
   cd server
   ```

2. Install dependencies:

   ```sh
   npm install
   ```
3. Set up your `.env` file (see example below).
4. Start the server:

   ```sh
   npm start
   ```

### .env Example

```
PORT=3000
DB_NAME=project2
DB_USERNAME=root
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=3306
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## API Endpoints

### Auth

- `POST /api/register` — Register a new user
- `POST /api/login` — Login and receive JWT

### Institute

- `POST /api/institute` — Create a new institute (protected)
- `GET /api/institute/student` — List students (protected)
- `GET /api/institute/teacher` — List teachers (protected)
- `GET /api/institute/courses` — List courses (protected)
- `GET /api/institute/category` — List categories (protected)


### Library / Book

- `POST /api/institute/library/book` — Create a new book
- `GET /api/institute/library/books` — List all books (with filters)
- `GET /api/institute/library/book/:id` — Get book by ID
- `PUT /api/institute/library/book/:id` — Update a book
- `DELETE /api/institute/library/book/:id` — Delete a book
- `POST /api/institute/library/borrow` — Borrow a book
- `POST /api/institute/library/return` — Return a book
- `GET /api/institute/library/borrow-history/:studentId` — Get student borrow history

### Course

- `POST /api/institute/courses` — Create a course (protected, supports file upload)
- `DELETE /api/institute/courses/:id` — Delete a course

### Category

- `POST /api/institute/category` — Create a category
- `DELETE /api/institute/category/:id` — Delete a category

### Teacher

- `POST /api/institute/teacher` — Create a teacher
- `DELETE /api/institute/teacher/:id` — Delete a teacher

### Student

- `POST /api/institute/student` — Create a student
- `DELETE /api/institute/student/:id` — Delete a student

## File Uploads

- Local uploads: stored in `/src/uploads/`
- Cloudinary uploads: configure Cloudinary credentials in `.env`


## Development

- Uses `nodemon` for auto-reload
- TypeScript for type safety
- **Prisma ORM** for all database access (no Sequelize/legacy SQL)
- Multi-tenancy via static tables and `instituteId` column (no dynamic tables)

## License

MIT

---

**Note:** This project is for educational/demo purposes. For production, add validation, error handling, and security best practices.
