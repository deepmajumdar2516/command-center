import { createCrudRouter } from '../utils/crudRouter';
import { projects } from '../db/schema';
export default createCrudRouter(projects, 'project');
