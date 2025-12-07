// Services exports
export { userService } from './users/users.service';
export { ActivityService } from './activities/activities.service';
export { paginationDto } from './common/pagination';

// 导出 activityService 实例
import { ActivityService } from './activities/activities.service';
export const activityService = new ActivityService();
