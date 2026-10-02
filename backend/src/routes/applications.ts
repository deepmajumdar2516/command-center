import { createCrudRouter } from '../utils/crudRouter';
import { applications } from '../db/schema';
export default createCrudRouter(applications, 'application');
