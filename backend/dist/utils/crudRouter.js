"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCrudRouter = createCrudRouter;
const express_1 = require("express");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
function createCrudRouter(table, logEntityName) {
    const router = (0, express_1.Router)();
    router.get('/', async (req, res) => {
        try {
            let records;
            if (table.deletedAt && req.query.deleted !== 'true') {
                records = await db_1.db.select().from(table).where((0, drizzle_orm_1.isNull)(table.deletedAt));
            }
            else if (table.deletedAt && req.query.deleted === 'true') {
                records = await db_1.db.select().from(table);
            }
            else {
                records = await db_1.db.select().from(table);
            }
            res.json(records);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    router.get('/:id', async (req, res) => {
        try {
            const records = await db_1.db.select().from(table).where((0, drizzle_orm_1.eq)(table.id, req.params.id));
            if (records.length === 0)
                return res.status(404).json({ error: 'Not found' });
            res.json(records[0]);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    router.post('/', async (req, res) => {
        try {
            const payload = { ...req.body };
            for (const key in payload) {
                if (typeof payload[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(payload[key])) {
                    payload[key] = new Date(payload[key]);
                }
            }
            const [record] = (await db_1.db.insert(table).values(payload).returning());
            res.status(201).json(record);
        }
        catch (error) {
            console.error("POST error:", error);
            res.status(500).json({ error: error.message });
        }
    });
    router.put('/:id', async (req, res) => {
        try {
            const payload = { ...req.body, updatedAt: new Date() };
            for (const key in payload) {
                if (typeof payload[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(payload[key])) {
                    payload[key] = new Date(payload[key]);
                }
            }
            const [record] = (await db_1.db.update(table).set(payload).where((0, drizzle_orm_1.eq)(table.id, req.params.id)).returning());
            if (!record)
                return res.status(404).json({ error: 'Not found' });
            res.json(record);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    router.delete('/:id', async (req, res) => {
        try {
            let record;
            if (table.deletedAt && req.query.permanent !== 'true') {
                const [updated] = (await db_1.db.update(table).set({ deletedAt: new Date() }).where((0, drizzle_orm_1.eq)(table.id, req.params.id)).returning());
                record = updated;
            }
            else {
                const [deleted] = (await db_1.db.delete(table).where((0, drizzle_orm_1.eq)(table.id, req.params.id)).returning());
                record = deleted;
            }
            if (!record)
                return res.status(404).json({ error: 'Not found' });
            res.json({ success: true, record });
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
    return router;
}
