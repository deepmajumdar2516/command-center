import { Router } from 'express';
import { createCrudRouter } from '../utils/crudRouter';
import { tasks } from '../db/schema';
import { extractDateFromText } from '../utils/dateExtractor';

const tasksRouter = Router();

// Middleware: Auto-extract date if mentioned in title or description and dueDate is not specified
tasksRouter.use((req, res, next) => {
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    if (!req.body.dueDate && (req.body.title || req.body.description)) {
      const extracted = extractDateFromText(`${req.body.title || ''} ${req.body.description || ''}`);
      if (extracted) {
        req.body.dueDate = extracted.toISOString();
      }
    }
  }
  next();
});

tasksRouter.use('/', createCrudRouter(tasks, 'task'));

export default tasksRouter;
