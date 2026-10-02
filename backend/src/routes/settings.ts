import { Router } from 'express';
import { db } from '../db';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

router.get('/', async (req, res) => {
  try {
    let records = await db.select().from(settings).where(eq(settings.id, 'global'));
    if (records.length === 0) {
      // Seed default settings
      const [newSettings] = await db.insert(settings).values({ id: 'global' }).returning();
      records = [newSettings];
    }
    res.json(records[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const payload = { ...req.body, updatedAt: new Date() };
    const [record] = await db.update(settings).set(payload).where(eq(settings.id, 'global')).returning();
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
