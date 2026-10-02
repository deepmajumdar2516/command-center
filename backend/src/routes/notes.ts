import { createCrudRouter } from '../utils/crudRouter';
import { notes } from '../db/schema';
export default createCrudRouter(notes, 'note');
