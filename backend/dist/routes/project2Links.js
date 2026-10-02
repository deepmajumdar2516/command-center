"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.project2LinksRouter = void 0;
const crudRouter_1 = require("../utils/crudRouter");
const schema_1 = require("../db/schema");
exports.project2LinksRouter = (0, crudRouter_1.createCrudRouter)(schema_1.project2Links, 'project2Links');
