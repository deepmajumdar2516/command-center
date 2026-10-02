"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
exports.backupRouter = (0, express_1.Router)();
exports.backupRouter.get('/export', async (req, res) => {
    try {
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            data: {
                tasks: await db_1.db.select().from(schema_1.tasks),
                projects: await db_1.db.select().from(schema_1.projects),
                notes: await db_1.db.select().from(schema_1.notes),
                calendarEvents: await db_1.db.select().from(schema_1.calendarEvents),
                ideas: await db_1.db.select().from(schema_1.ideas),
                applications: await db_1.db.select().from(schema_1.applications),
                learningItems: await db_1.db.select().from(schema_1.learningItems),
                worksheets: await db_1.db.select().from(schema_1.worksheets),
                goals: await db_1.db.select().from(schema_1.goals),
                activityLogs: await db_1.db.select().from(schema_1.activityLogs),
                whiteboards: await db_1.db.select().from(schema_1.whiteboards),
                settings: await db_1.db.select().from(schema_1.settings),
                notifications: await db_1.db.select().from(schema_1.notifications),
            }
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=deep_backup.json');
        res.send(JSON.stringify(backupData, null, 2));
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.backupRouter.post('/import', async (req, res) => {
    // A complete restore is very complex to do safely.
    // In a robust application, you would do this inside a transaction, truncating tables and inserting.
    // We will do this carefully.
    try {
        const { data, version } = req.body;
        if (!data || version !== '1.0.0') {
            return res.status(400).json({ error: 'Invalid backup file format' });
        }
        await db_1.db.transaction(async (tx) => {
            if (data.tasks) {
                await tx.delete(schema_1.tasks);
                await tx.insert(schema_1.tasks).values(data.tasks);
            }
            if (data.projects) {
                await tx.delete(schema_1.projects);
                await tx.insert(schema_1.projects).values(data.projects);
            }
            if (data.notes) {
                await tx.delete(schema_1.notes);
                await tx.insert(schema_1.notes).values(data.notes);
            }
            if (data.calendarEvents) {
                await tx.delete(schema_1.calendarEvents);
                await tx.insert(schema_1.calendarEvents).values(data.calendarEvents);
            }
            if (data.ideas) {
                await tx.delete(schema_1.ideas);
                await tx.insert(schema_1.ideas).values(data.ideas);
            }
            if (data.applications) {
                await tx.delete(schema_1.applications);
                await tx.insert(schema_1.applications).values(data.applications);
            }
            if (data.learningItems) {
                await tx.delete(schema_1.learningItems);
                await tx.insert(schema_1.learningItems).values(data.learningItems);
            }
            if (data.worksheets) {
                await tx.delete(schema_1.worksheets);
                await tx.insert(schema_1.worksheets).values(data.worksheets);
            }
            if (data.goals) {
                await tx.delete(schema_1.goals);
                await tx.insert(schema_1.goals).values(data.goals);
            }
            if (data.activityLogs) {
                await tx.delete(schema_1.activityLogs);
                await tx.insert(schema_1.activityLogs).values(data.activityLogs);
            }
            if (data.whiteboards) {
                await tx.delete(schema_1.whiteboards);
                await tx.insert(schema_1.whiteboards).values(data.whiteboards);
            }
            if (data.settings && data.settings.length > 0) {
                await tx.delete(schema_1.settings);
                await tx.insert(schema_1.settings).values(data.settings);
            }
            if (data.notifications) {
                await tx.delete(schema_1.notifications);
                await tx.insert(schema_1.notifications).values(data.notifications);
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Restore failed:", error);
        res.status(500).json({ error: error.message });
    }
});
