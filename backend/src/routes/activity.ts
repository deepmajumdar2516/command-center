import { Router } from 'express';
import { db } from '../db';
import { activityLogs } from '../db/schema';
import { desc } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const records = await db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp)).limit(50);
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const [record] = await db.insert(activityLogs).values(req.body).returning();
    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
