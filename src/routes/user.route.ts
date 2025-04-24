import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { checkAdminRole, verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', verifyToken, checkAdminRole, userController.getAllUsers);

router.post('/', verifyToken, checkAdminRole, userController.createUser);

router.get('/:id', verifyToken, checkAdminRole, userController.getUserById);

router.put('/:id', verifyToken, userController.updateUser);

router.delete('/:id', verifyToken, userController.deleteUser);

export default router;
