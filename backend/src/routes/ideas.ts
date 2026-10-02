import { createCrudRouter } from '../utils/crudRouter';
import { ideas } from '../db/schema';
export default createCrudRouter(ideas, 'idea');
