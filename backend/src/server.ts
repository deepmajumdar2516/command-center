import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { activityLogs } from './db/schema';

import tasksRouter from './routes/tasks';
import projectsRouter from './routes/projects';
import { projects2Router } from './routes/projects2';
import { project2FilesRouter } from './routes/project2Files';
import { project2LinksRouter } from './routes/project2Links';
import notesRouter from './routes/notes';
import calendarRouter from './routes/calendar';
import ideasRouter from './routes/ideas';
import applicationsRouter from './routes/applications';
import learningRouter from './routes/learning';
import worksheetsRouter from './routes/worksheets';
import goalsRouter from './routes/goals';
import settingsRouter from './routes/settings';
import activityRouter from './routes/activity';

import { whiteboardsRouter } from './routes/whiteboards';
import { whiteboards2Router } from './routes/whiteboards2';
import { searchRouter } from './routes/search';
import { notificationsRouter } from './routes/notifications';
import { analyticsRouter } from './routes/analytics';
import { backupRouter } from './routes/backup';

import path from 'path';
import basicAuth from 'express-basic-auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Basic Authentication for production
if (process.env.AUTH_USERNAME && process.env.AUTH_PASSWORD) {
  app.use(basicAuth({
    users: { [process.env.AUTH_USERNAME]: process.env.AUTH_PASSWORD },
    challenge: true,
  }));
}

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.get('/api/health', async (req, res) => {
  try {
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for Neon database to wake up')), 15000));
    await Promise.race([db.execute(sql`SELECT 1`), timeout]);
    res.json({ status: 'ok', database: 'connected' });
  } catch (error: any) {
    console.error('[Health Check] Database connection failed:', error);
    res.status(200).json({ status: 'error', database: 'offline', error: error.message || String(error) });
  }
});

app.use('/api/tasks', tasksRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/projects2', projects2Router);
app.use('/api/project2Files', project2FilesRouter);
app.use('/api/project2Links', project2LinksRouter);
app.use('/api/notes', notesRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/ideas', ideasRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/learning', learningRouter);
app.use('/api/worksheets', worksheetsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/activity', activityRouter);
app.use('/api/whiteboards', whiteboardsRouter);
app.use('/api/whiteboards2', whiteboards2Router);
app.use('/api/search', searchRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/backup', backupRouter);

// Serve frontend in production
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// touch
