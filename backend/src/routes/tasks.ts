import { createCrudRouter } from '../utils/crudRouter';
import { tasks } from '../db/schema';
export default createCrudRouter(tasks, 'task');
