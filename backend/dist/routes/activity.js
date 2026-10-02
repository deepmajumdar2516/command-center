"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const records = await db_1.db.select().from(schema_1.activityLogs).orderBy((0, drizzle_orm_1.desc)(schema_1.activityLogs.timestamp)).limit(50);
        res.json(records);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/', async (req, res) => {
    try {
        const [record] = await db_1.db.insert(schema_1.activityLogs).values(req.body).returning();
        res.status(201).json(record);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
