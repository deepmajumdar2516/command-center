import { Router } from "express";
import { createCrudRouter } from "../utils/crudRouter";
import { projects2, project2Files, project2Links } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export const projects2Router = createCrudRouter(projects2, 'project2');

// Add custom endpoints to get files and links
projects2Router.get("/:id/files", async (req, res) => {
  try {
    const files = await db.select().from(project2Files).where(eq(project2Files.projectId, req.params.id));
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

projects2Router.get("/:id/links", async (req, res) => {
  try {
    const links = await db.select().from(project2Links).where(eq(project2Links.projectId, req.params.id));
    res.json(links);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
