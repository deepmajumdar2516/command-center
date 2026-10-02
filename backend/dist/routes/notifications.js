"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRouter = void 0;
const crudRouter_1 = require("../utils/crudRouter");
const schema_1 = require("../db/schema");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
exports.notificationsRouter = (0, crudRouter_1.createCrudRouter)(schema_1.notifications, 'Notification');
// Add a specific route to mark as read/unread
exports.notificationsRouter.put('/:id/read', async (req, res) => {
    try {
        const { read } = req.body;
        const [record] = (await db_1.db.update(schema_1.notifications)
            .set({ read: Boolean(read) })
            .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, req.params.id))
            .returning());
        if (!record)
            return res.status(404).json({ error: 'Not found' });
        res.json(record);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.notificationsRouter.post('/mark-all-read', async (req, res) => {
    try {
        await db_1.db.update(schema_1.notifications).set({ read: true });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
