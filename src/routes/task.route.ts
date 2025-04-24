import { Router } from 'express';
import * as taskController from '../controllers/task.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', verifyToken, taskController.getAllTasks);

router.get('/my', verifyToken, taskController.getUsersTasks);

router.get('/:id', verifyToken, taskController.getTaskById);

router.post('/', verifyToken, taskController.createTask);

router.put('/:id', verifyToken, taskController.updateTask);

router.delete('/:id', verifyToken, taskController.deleteTask);

router.post('/:id/subtasks', verifyToken, taskController.addSubtask);

export default router;
