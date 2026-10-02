"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whiteboardsRouter = void 0;
const crudRouter_1 = require("../utils/crudRouter");
const schema_1 = require("../db/schema");
exports.whiteboardsRouter = (0, crudRouter_1.createCrudRouter)(schema_1.whiteboards, 'whiteboards');
