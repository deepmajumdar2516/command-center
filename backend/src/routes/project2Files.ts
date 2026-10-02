import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db";
import { project2Files } from "../db/schema";
import { eq } from "drizzle-orm";

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

router.delete("/:id", async (req, res) => {
  try {
    const fileRecord = await db.select().from(project2Files).where(eq(project2Files.id, req.params.id));
    if (fileRecord.length > 0) {
      const filePath = path.join(__dirname, "../../", fileRecord[0].url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await db.delete(project2Files).where(eq(project2Files.id, req.params.id));
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const project2FilesRouter = router;
