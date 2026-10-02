import { createCrudRouter } from '../utils/crudRouter';
import { notifications } from '../db/schema';
import { Router } from 'express';
import { db } from '../db';
import { eq } from 'drizzle-orm';

export const notificationsRouter = createCrudRouter(notifications, 'Notification');

// Add a specific route to mark as read/unread
notificationsRouter.put('/:id/read', async (req, res) => {
  try {
    const { read } = req.body;
    const [record] = (await db.update(notifications)
      .set({ read: Boolean(read) })
      .where(eq(notifications.id, req.params.id))
      .returning()) as any;
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

notificationsRouter.post('/mark-all-read', async (req, res) => {
  try {
    await db.update(notifications).set({ read: true });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
