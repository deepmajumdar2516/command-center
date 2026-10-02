import { Router } from "express";
import { createCrudRouter } from "../utils/crudRouter";
import { whiteboards } from "../db/schema";

export const whiteboardsRouter = createCrudRouter(whiteboards, 'whiteboards');
