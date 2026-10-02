import { Router } from "express";
import { createCrudRouter } from "../utils/crudRouter";
import { whiteboards2 } from "../db/schema";

export const whiteboards2Router = createCrudRouter(whiteboards2, 'whiteboards2');
