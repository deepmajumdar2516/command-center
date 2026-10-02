import { Router } from 'express';
import { db } from '../db';
import { eq, isNull, and } from 'drizzle-orm';

export function createCrudRouter(table: any, logEntityName: string) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      let records;
      if (table.deletedAt && req.query.deleted !== 'true') {
        records = await db.select().from(table).where(isNull(table.deletedAt));
      } else if (table.deletedAt && req.query.deleted === 'true') {
        records = await db.select().from(table);
      } else {
        records = await db.select().from(table);
      }
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const records = await db.select().from(table).where(eq(table.id, req.params.id));
      if (records.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(records[0]);
    } catch (error: any) {
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
      const [record] = (await db.insert(table).values(payload).returning()) as any;
      res.status(201).json(record);
    } catch (error: any) {
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
      const [record] = (await db.update(table).set(payload).where(eq(table.id, req.params.id)).returning()) as any;
      if (!record) return res.status(404).json({ error: 'Not found' });
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      let record;
      if (table.deletedAt && req.query.permanent !== 'true') {
        const [updated] = (await db.update(table).set({ deletedAt: new Date() }).where(eq(table.id, req.params.id)).returning()) as any;
        record = updated;
      } else {
        const [deleted] = (await db.delete(table).where(eq(table.id, req.params.id)).returning()) as any;
        record = deleted;
      }
      if (!record) return res.status(404).json({ error: 'Not found' });
      res.json({ success: true, record });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
