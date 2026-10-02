"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        let records = await db_1.db.select().from(schema_1.settings).where((0, drizzle_orm_1.eq)(schema_1.settings.id, 'global'));
        if (records.length === 0) {
            // Seed default settings
            const [newSettings] = await db_1.db.insert(schema_1.settings).values({ id: 'global' }).returning();
            records = [newSettings];
        }
        res.json(records[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/', async (req, res) => {
    try {
        const payload = { ...req.body, updatedAt: new Date() };
        const [record] = await db_1.db.update(schema_1.settings).set(payload).where((0, drizzle_orm_1.eq)(schema_1.settings.id, 'global')).returning();
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
