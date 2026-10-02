import { createCrudRouter } from '../utils/crudRouter';
import { worksheets } from '../db/schema';
export default createCrudRouter(worksheets, 'worksheet');
