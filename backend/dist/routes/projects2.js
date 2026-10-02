"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projects2Router = void 0;
const crudRouter_1 = require("../utils/crudRouter");
const schema_1 = require("../db/schema");
const db_1 = require("../db");
const drizzle_orm_1 = require("drizzle-orm");
exports.projects2Router = (0, crudRouter_1.createCrudRouter)(schema_1.projects2, 'project2');
// Add custom endpoints to get files and links
exports.projects2Router.get("/:id/files", async (req, res) => {
    try {
        const files = await db_1.db.select().from(schema_1.project2Files).where((0, drizzle_orm_1.eq)(schema_1.project2Files.projectId, req.params.id));
        res.json(files);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.projects2Router.get("/:id/links", async (req, res) => {
    try {
        const links = await db_1.db.select().from(schema_1.project2Links).where((0, drizzle_orm_1.eq)(schema_1.project2Links.projectId, req.params.id));
        res.json(links);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
