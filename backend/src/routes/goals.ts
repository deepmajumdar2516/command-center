import { createCrudRouter } from '../utils/crudRouter';
import { goals } from '../db/schema';
export default createCrudRouter(goals, 'goal');
