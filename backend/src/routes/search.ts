import { Router } from 'express';
import { db } from '../db';
import { ilike, or, and, isNull } from 'drizzle-orm';
import { tasks, projects, notes, ideas, applications, learningItems, goals, calendarEvents, worksheets } from '../db/schema';

export const searchRouter = Router();

searchRouter.get('/', async (req, res) => {
  const query = (req.query.q as string) || '';
  if (!query || query.length < 2) {
    return res.json([]);
  }

  const searchPattern = `%${query}%`;
  const results: any[] = [];

  try {
    // Helper to safely check deletedAt if it exists
    const notDeleted = (table: any) => isNull(table.deletedAt);

    // 1. Tasks
    const foundTasks = await db.select().from(tasks).where(
      and(notDeleted(tasks), or(ilike(tasks.title, searchPattern), ilike(tasks.description, searchPattern)))
    ).limit(5);
    foundTasks.forEach(t => results.push({ id: t.id, type: 'task', title: t.title, subtitle: t.status, date: t.dueDate }));

    // 2. Projects
    const foundProjects = await db.select().from(projects).where(
      and(notDeleted(projects), or(ilike(projects.name, searchPattern), ilike(projects.description, searchPattern)))
    ).limit(5);
    foundProjects.forEach(p => results.push({ id: p.id, type: 'project', title: p.name, subtitle: p.status, date: p.targetDate }));

    // 3. Notes
    const foundNotes = await db.select().from(notes).where(
      and(notDeleted(notes), or(ilike(notes.title, searchPattern), ilike(notes.content, searchPattern)))
    ).limit(5);
    foundNotes.forEach(n => results.push({ id: n.id, type: 'note', title: n.title, subtitle: n.category, date: n.updatedAt }));

    // 4. Ideas
    const foundIdeas = await db.select().from(ideas).where(
      and(notDeleted(ideas), or(ilike(ideas.title, searchPattern), ilike(ideas.problem, searchPattern), ilike(ideas.solution, searchPattern)))
    ).limit(5);
    foundIdeas.forEach(i => results.push({ id: i.id, type: 'idea', title: i.title, subtitle: i.status, date: i.createdAt }));

    // 5. Applications
    const foundApps = await db.select().from(applications).where(
      and(notDeleted(applications), or(ilike(applications.company, searchPattern), ilike(applications.role, searchPattern)))
    ).limit(5);
    foundApps.forEach(a => results.push({ id: a.id, type: 'application', title: `${a.role} at ${a.company}`, subtitle: a.status, date: a.applicationDate }));

    // 6. Learning
    const foundLearning = await db.select().from(learningItems).where(
      and(notDeleted(learningItems), ilike(learningItems.title, searchPattern))
    ).limit(5);
    foundLearning.forEach(l => results.push({ id: l.id, type: 'learning', title: l.title, subtitle: l.status, date: l.targetDate }));

    // 7. Goals
    const foundGoals = await db.select().from(goals).where(
      and(notDeleted(goals), or(ilike(goals.name, searchPattern), ilike(goals.description, searchPattern)))
    ).limit(5);
    foundGoals.forEach(g => results.push({ id: g.id, type: 'goal', title: g.name, subtitle: g.status, date: g.targetDate }));

    // 8. Calendar Events
    const foundEvents = await db.select().from(calendarEvents).where(
      and(notDeleted(calendarEvents), or(ilike(calendarEvents.title, searchPattern), ilike(calendarEvents.description, searchPattern)))
    ).limit(5);
    foundEvents.forEach(e => results.push({ id: e.id, type: 'calendarEvent', title: e.title, subtitle: 'Calendar Event', date: e.start }));

    res.json(results);
  } catch (error: any) {
    console.error("Search error:", error);
    res.status(500).json({ error: error.message });
  }
});
