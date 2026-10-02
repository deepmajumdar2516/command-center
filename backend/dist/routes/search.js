"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
exports.searchRouter = (0, express_1.Router)();
exports.searchRouter.get('/', async (req, res) => {
    const query = req.query.q || '';
    if (!query || query.length < 2) {
        return res.json([]);
    }
    const searchPattern = `%${query}%`;
    const results = [];
    try {
        // Helper to safely check deletedAt if it exists
        const notDeleted = (table) => (0, drizzle_orm_1.isNull)(table.deletedAt);
        // 1. Tasks
        const foundTasks = await db_1.db.select().from(schema_1.tasks).where((0, drizzle_orm_1.and)(notDeleted(schema_1.tasks), (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.tasks.title, searchPattern), (0, drizzle_orm_1.ilike)(schema_1.tasks.description, searchPattern)))).limit(5);
        foundTasks.forEach(t => results.push({ id: t.id, type: 'task', title: t.title, subtitle: t.status, date: t.dueDate }));
        // 2. Projects
        const foundProjects = await db_1.db.select().from(schema_1.projects).where((0, drizzle_orm_1.and)(notDeleted(schema_1.projects), (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.projects.name, searchPattern), (0, drizzle_orm_1.ilike)(schema_1.projects.description, searchPattern)))).limit(5);
        foundProjects.forEach(p => results.push({ id: p.id, type: 'project', title: p.name, subtitle: p.status, date: p.targetDate }));
        // 3. Notes
        const foundNotes = await db_1.db.select().from(schema_1.notes).where((0, drizzle_orm_1.and)(notDeleted(schema_1.notes), (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.notes.title, searchPattern), (0, drizzle_orm_1.ilike)(schema_1.notes.content, searchPattern)))).limit(5);
        foundNotes.forEach(n => results.push({ id: n.id, type: 'note', title: n.title, subtitle: n.category, date: n.updatedAt }));
        // 4. Ideas
        const foundIdeas = await db_1.db.select().from(schema_1.ideas).where((0, drizzle_orm_1.and)(notDeleted(schema_1.ideas), (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.ideas.title, searchPattern), (0, drizzle_orm_1.ilike)(schema_1.ideas.problem, searchPattern), (0, drizzle_orm_1.ilike)(schema_1.ideas.solution, searchPattern)))).limit(5);
        foundIdeas.forEach(i => results.push({ id: i.id, type: 'idea', title: i.title, subtitle: i.status, date: i.createdAt }));
        // 5. Applications
        const foundApps = await db_1.db.select().from(schema_1.applications).where((0, drizzle_orm_1.and)(notDeleted(schema_1.applications), (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.applications.company, searchPattern), (0, drizzle_orm_1.ilike)(schema_1.applications.role, searchPattern)))).limit(5);
        foundApps.forEach(a => results.push({ id: a.id, type: 'application', title: `${a.role} at ${a.company}`, subtitle: a.status, date: a.applicationDate }));
        // 6. Learning
        const foundLearning = await db_1.db.select().from(schema_1.learningItems).where((0, drizzle_orm_1.and)(notDeleted(schema_1.learningItems), (0, drizzle_orm_1.ilike)(schema_1.learningItems.title, searchPattern))).limit(5);
        foundLearning.forEach(l => results.push({ id: l.id, type: 'learning', title: l.title, subtitle: l.status, date: l.targetDate }));
        // 7. Goals
        const foundGoals = await db_1.db.select().from(schema_1.goals).where((0, drizzle_orm_1.and)(notDeleted(schema_1.goals), (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.goals.name, searchPattern), (0, drizzle_orm_1.ilike)(schema_1.goals.description, searchPattern)))).limit(5);
        foundGoals.forEach(g => results.push({ id: g.id, type: 'goal', title: g.name, subtitle: g.status, date: g.targetDate }));
        // 8. Calendar Events
        const foundEvents = await db_1.db.select().from(schema_1.calendarEvents).where((0, drizzle_orm_1.and)(notDeleted(schema_1.calendarEvents), (0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(schema_1.calendarEvents.title, searchPattern), (0, drizzle_orm_1.ilike)(schema_1.calendarEvents.description, searchPattern)))).limit(5);
        foundEvents.forEach(e => results.push({ id: e.id, type: 'calendarEvent', title: e.title, subtitle: 'Calendar Event', date: e.start }));
        res.json(results);
    }
    catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: error.message });
    }
});
