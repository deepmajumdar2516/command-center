"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crudRouter_1 = require("../utils/crudRouter");
const schema_1 = require("../db/schema");
const dateExtractor_1 = require("../utils/dateExtractor");
const tasksRouter = (0, express_1.Router)();
// Middleware: Auto-extract date if mentioned in title or description and dueDate is not specified
tasksRouter.use((req, res, next) => {
    if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
        if (!req.body.dueDate && (req.body.title || req.body.description)) {
            const extracted = (0, dateExtractor_1.extractDateFromText)(`${req.body.title || ''} ${req.body.description || ''}`);
            if (extracted) {
                req.body.dueDate = extracted.toISOString();
            }
        }
    }
    next();
});
tasksRouter.use('/', (0, crudRouter_1.createCrudRouter)(schema_1.tasks, 'task'));
exports.default = tasksRouter;
