# DEEP // PERSONAL COMMAND CENTER

"Organize. Build. Execute."

A complete, production-ready personal productivity and developer operating system.

## Features

- **14 Full Modules**: Dashboard, Tasks, Projects, Notes, Calendar, Workspace, Ideas, Applications, Learning, Worksheets, Goals, Whiteboard, Activity, Settings.
- **Persistent Data**: Uses PostgreSQL as the primary data store. No fake persistence. Data survives reloads and browser restarts.
- **REST API**: Node.js Express backend communicating with the frontend.
- **Modern Frontend**: React 18, TypeScript, Vite, Tailwind CSS 4, Zustand.
- **Dark Hacker Aesthetic**: Designed for developers with glass panels and grid backgrounds.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS 4, Zustand, React Router v6, Lucide React, date-fns, uuid.
- **Backend**: Node.js, Express, TypeScript, REST API, dotenv, CORS.
- **Database**: PostgreSQL, Drizzle ORM, Drizzle Kit.

## Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Environment Setup

1. Copy `.env.example` to `.env` in the `backend` directory.
2. Update the `DATABASE_URL` with your PostgreSQL connection string.

```env
DATABASE_URL=postgresql://username:password@localhost:5432/deep
PORT=5000
FRONTEND_URL=http://localhost:5173
```

## Database Setup

Run the following commands in the `backend` directory:

```bash
npm run db:generate
npm run db:migrate
```
*(Optionally use `db:push` for rapid schema prototyping)*

## Running the Application

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` and backend at `http://localhost:5000`.

## Production Deployment

Configure `DATABASE_URL` and `FRONTEND_URL` in your production environment. Build the frontend using `npm run build` and serve the static files, or deploy the backend and frontend separately to services like Vercel and Render.
