import { Router } from "express";
import { createCrudRouter } from "../utils/crudRouter";
import { projects2, project2Files, project2Links } from "../db/schema";
import { db } from "../db";
import { eq, isNull, and } from "drizzle-orm";

export const projects2Router = createCrudRouter(projects2, 'project2');

// Add custom endpoints to get files and links (filtering out deleted items)
projects2Router.get("/:id/files", async (req, res) => {
  try {
    const files = await db.select().from(project2Files).where(
      and(eq(project2Files.projectId, req.params.id), isNull(project2Files.deletedAt))
    );
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

projects2Router.get("/:id/links", async (req, res) => {
  try {
    const links = await db.select().from(project2Links).where(
      and(eq(project2Links.projectId, req.params.id), isNull(project2Links.deletedAt))
    );
    res.json(links);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
