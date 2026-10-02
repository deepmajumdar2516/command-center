import { Router } from 'express';
import { db } from '../db';
import { sql, isNull, and, gte } from 'drizzle-orm';
import { tasks, projects, learningItems, applications, goals } from '../db/schema';

export const analyticsRouter = Router();

analyticsRouter.get('/', async (req, res) => {
  try {
    const notDeleted = (table: any) => isNull(table.deletedAt);

    // Tasks completed by date
    const tasksCompleted = await db.select({
      date: sql`date_trunc('day', ${tasks.completedAt})`.as('date'),
      count: sql`count(*)`.as('count')
    })
    .from(tasks)
    .where(and(notDeleted(tasks), sql`${tasks.completedAt} IS NOT NULL`))
    .groupBy(sql`date_trunc('day', ${tasks.completedAt})`)
    .orderBy(sql`date_trunc('day', ${tasks.completedAt})`);

    // Study hours
    const studyHours = await db.select({
      totalHours: sql`sum(${learningItems.studyTime})`.as('totalHours')
    })
    .from(learningItems)
    .where(notDeleted(learningItems));

    // Project progress
    const projectProgress = await db.select({
      name: projects.name,
      progress: projects.progress
    })
    .from(projects)
    .where(notDeleted(projects));

    // Application statuses
    const appStatuses = await db.select({
      status: applications.status,
      count: sql`count(*)`.as('count')
    })
    .from(applications)
    .where(notDeleted(applications))
    .groupBy(applications.status);

    res.json({
      tasksCompleted,
      studyHours: studyHours[0]?.totalHours || 0,
      projectProgress,
      appStatuses
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
