"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crudRouter_1 = require("../utils/crudRouter");
const schema_1 = require("../db/schema");
exports.default = (0, crudRouter_1.createCrudRouter)(schema_1.projects, 'project');
