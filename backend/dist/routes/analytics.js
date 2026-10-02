"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../db/schema");
exports.analyticsRouter = (0, express_1.Router)();
exports.analyticsRouter.get('/', async (req, res) => {
    try {
        const notDeleted = (table) => (0, drizzle_orm_1.isNull)(table.deletedAt);
        // Tasks completed by date
        const tasksCompleted = await db_1.db.select({
            date: (0, drizzle_orm_1.sql) `date_trunc('day', ${schema_1.tasks.completedAt})`.as('date'),
            count: (0, drizzle_orm_1.sql) `count(*)`.as('count')
        })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)(notDeleted(schema_1.tasks), (0, drizzle_orm_1.sql) `${schema_1.tasks.completedAt} IS NOT NULL`))
            .groupBy((0, drizzle_orm_1.sql) `date_trunc('day', ${schema_1.tasks.completedAt})`)
            .orderBy((0, drizzle_orm_1.sql) `date_trunc('day', ${schema_1.tasks.completedAt})`);
        // Study hours
        const studyHours = await db_1.db.select({
            totalHours: (0, drizzle_orm_1.sql) `sum(${schema_1.learningItems.studyTime})`.as('totalHours')
        })
            .from(schema_1.learningItems)
            .where(notDeleted(schema_1.learningItems));
        // Project progress
        const projectProgress = await db_1.db.select({
            name: schema_1.projects.name,
            progress: schema_1.projects.progress
        })
            .from(schema_1.projects)
            .where(notDeleted(schema_1.projects));
        // Application statuses
        const appStatuses = await db_1.db.select({
            status: schema_1.applications.status,
            count: (0, drizzle_orm_1.sql) `count(*)`.as('count')
        })
            .from(schema_1.applications)
            .where(notDeleted(schema_1.applications))
            .groupBy(schema_1.applications.status);
        res.json({
            tasksCompleted,
            studyHours: studyHours[0]?.totalHours || 0,
            projectProgress,
            appStatuses
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
