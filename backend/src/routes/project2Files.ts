import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { project2Files } from "../db/schema";
import { eq, isNull, isNotNull } from "drizzle-orm";

const router = Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.get("/", async (req, res) => {
  try {
    let records;
    if (req.query.deleted === "true") {
      records = await db.select().from(project2Files).where(isNotNull(project2Files.deletedAt));
    } else {
      records = await db.select().from(project2Files).where(isNull(project2Files.deletedAt));
    }
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const records = await db.select().from(project2Files).where(eq(project2Files.id, req.params.id));
    if (records.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(records[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ error: "projectId is required" });
    }

    const newFile = await db.insert(project2Files).values({
      projectId,
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`,
    }).returning();

    res.json(newFile[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const payload = { ...req.body };
    const [record] = await db.update(project2Files).set(payload).where(eq(project2Files.id, req.params.id)).returning();
    if (!record) return res.status(404).json({ error: "Not found" });
    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const fileRecord = await db.select().from(project2Files).where(eq(project2Files.id, req.params.id));
    if (fileRecord.length > 0) {
      if (req.query.permanent === "true") {
        const filePath = path.join(__dirname, "../../", fileRecord[0].url);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error("Failed to delete file from disk:", e);
          }
        }
        await db.delete(project2Files).where(eq(project2Files.id, req.params.id));
      } else {
        await db.update(project2Files).set({ deletedAt: new Date() }).where(eq(project2Files.id, req.params.id));
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const project2FilesRouter = router;
