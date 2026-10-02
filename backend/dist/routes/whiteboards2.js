"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whiteboards2Router = void 0;
const crudRouter_1 = require("../utils/crudRouter");
const schema_1 = require("../db/schema");
exports.whiteboards2Router = (0, crudRouter_1.createCrudRouter)(schema_1.whiteboards2, 'whiteboards2');
