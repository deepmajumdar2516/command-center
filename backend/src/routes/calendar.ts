import { createCrudRouter } from '../utils/crudRouter';
import { calendarEvents } from '../db/schema';
export default createCrudRouter(calendarEvents, 'calendar event');
