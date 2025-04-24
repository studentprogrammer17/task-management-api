import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', authController.register);

router.post('/register-admin', authController.registerAdmin);

router.post('/login', authController.login);

router.get('/me', verifyToken, authController.getMe);

router.post('/changePassword', verifyToken, authController.changePassword);
//@ts-ignore
router.post('/verify-token', authController.isTokenExpired);

export default router;
