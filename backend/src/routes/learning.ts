import { createCrudRouter } from '../utils/crudRouter';
import { learningItems } from '../db/schema';
export default createCrudRouter(learningItems, 'learning item');
