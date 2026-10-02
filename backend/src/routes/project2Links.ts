import { Router } from "express";
import { createCrudRouter } from "../utils/crudRouter";
import { project2Links } from "../db/schema";

export const project2LinksRouter = createCrudRouter(project2Links, 'project2Links');
