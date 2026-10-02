import { Router } from 'express';
import { db } from '../db';
import { 
  tasks, projects, notes, calendarEvents, ideas, applications, 
  learningItems, worksheets, goals, activityLogs, whiteboards, settings, notifications
} from '../db/schema';

export const backupRouter = Router();

backupRouter.get('/export', async (req, res) => {
  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        tasks: await db.select().from(tasks),
        projects: await db.select().from(projects),
        notes: await db.select().from(notes),
        calendarEvents: await db.select().from(calendarEvents),
        ideas: await db.select().from(ideas),
        applications: await db.select().from(applications),
        learningItems: await db.select().from(learningItems),
        worksheets: await db.select().from(worksheets),
        goals: await db.select().from(goals),
        activityLogs: await db.select().from(activityLogs),
        whiteboards: await db.select().from(whiteboards),
        settings: await db.select().from(settings),
        notifications: await db.select().from(notifications),
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=deep_backup.json');
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

backupRouter.post('/import', async (req, res) => {
  // A complete restore is very complex to do safely.
  // In a robust application, you would do this inside a transaction, truncating tables and inserting.
  // We will do this carefully.
  try {
    const { data, version } = req.body;
    
    if (!data || version !== '1.0.0') {
      return res.status(400).json({ error: 'Invalid backup file format' });
    }

    await db.transaction(async (tx) => {
      if (data.tasks) { await tx.delete(tasks); await tx.insert(tasks).values(data.tasks); }
      if (data.projects) { await tx.delete(projects); await tx.insert(projects).values(data.projects); }
      if (data.notes) { await tx.delete(notes); await tx.insert(notes).values(data.notes); }
      if (data.calendarEvents) { await tx.delete(calendarEvents); await tx.insert(calendarEvents).values(data.calendarEvents); }
      if (data.ideas) { await tx.delete(ideas); await tx.insert(ideas).values(data.ideas); }
      if (data.applications) { await tx.delete(applications); await tx.insert(applications).values(data.applications); }
      if (data.learningItems) { await tx.delete(learningItems); await tx.insert(learningItems).values(data.learningItems); }
      if (data.worksheets) { await tx.delete(worksheets); await tx.insert(worksheets).values(data.worksheets); }
      if (data.goals) { await tx.delete(goals); await tx.insert(goals).values(data.goals); }
      if (data.activityLogs) { await tx.delete(activityLogs); await tx.insert(activityLogs).values(data.activityLogs); }
      if (data.whiteboards) { await tx.delete(whiteboards); await tx.insert(whiteboards).values(data.whiteboards); }
      if (data.settings && data.settings.length > 0) { 
        await tx.delete(settings); 
        await tx.insert(settings).values(data.settings); 
      }
      if (data.notifications) { await tx.delete(notifications); await tx.insert(notifications).values(data.notifications); }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error("Restore failed:", error);
    res.status(500).json({ error: error.message });
  }
});
