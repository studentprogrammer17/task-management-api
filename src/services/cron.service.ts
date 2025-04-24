import cron from 'node-cron';
import taskRepository from '../repositories/task.repository';
import EmailService from './email.service';

class CronService {
  private static instance: CronService;
  private cronJob: cron.ScheduledTask | null = null;
  private emailService = EmailService.getInstance();

  private constructor() {}

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  public startCronJob(): void {
    this.cronJob = cron.schedule('*/30 * * * * *', async () => {
      const tasks = await taskRepository.getAllTasks();
      // for (const task of tasks) {
      //   if (task.endTime && task.status !== 'done') {
      //     const endTimeDate = new Date(task.endTime);
      //     const now = new Date();
      //     now.setHours(now.getHours() + 3);

      //     if (now >= endTimeDate) {
      //       await taskRepository.updateTask(task.id, { status: 'done' });
      //       await this.emailService.sendTaskNotification(
      //         'gemoh73859@macho3.com',
      //         task.title,
      //         task.endTime
      //       );
      //     }
      //   }
      // }
    });
  }

  public stopCronJob(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
  }
}

export default CronService;
