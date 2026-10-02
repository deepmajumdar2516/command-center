"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.project2FilesRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
// Configure multer
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const dir = path_1.default.join(__dirname, "../../uploads");
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = (0, multer_1.default)({ storage });
router.post("/", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const { projectId } = req.body;
        if (!projectId) {
            return res.status(400).json({ error: "projectId is required" });
        }
        const newFile = await db_1.db.insert(schema_1.project2Files).values({
            projectId,
            name: req.file.originalname,
            type: req.file.mimetype,
            size: req.file.size,
            url: `/uploads/${req.file.filename}`,
        }).returning();
        res.json(newFile[0]);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete("/:id", async (req, res) => {
    try {
        const fileRecord = await db_1.db.select().from(schema_1.project2Files).where((0, drizzle_orm_1.eq)(schema_1.project2Files.id, req.params.id));
        if (fileRecord.length > 0) {
            const filePath = path_1.default.join(__dirname, "../../", fileRecord[0].url);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
            await db_1.db.delete(schema_1.project2Files).where((0, drizzle_orm_1.eq)(schema_1.project2Files.id, req.params.id));
        }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.project2FilesRouter = router;
