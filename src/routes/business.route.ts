import express from 'express';
import {
  getAllUserBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  uploadMiddleware,
  getUserBusinesses,
  changeStatus,
  getBusinessesByStatus,
  getAllBusinesses,
} from '../controllers/business.controller';
import { checkAdminRole, verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/all', verifyToken, getAllBusinesses);
router.get('/', verifyToken, getAllUserBusinesses);
router.get(
  '/status/:status',
  verifyToken,
  checkAdminRole,
  getBusinessesByStatus
);
router.get('/my', verifyToken, getUserBusinesses);
router.get('/:id', verifyToken, getBusinessById);
router.post('/', verifyToken, uploadMiddleware, createBusiness);
router.put('/:id', verifyToken, uploadMiddleware, updateBusiness);
router.delete('/:id', verifyToken, deleteBusiness);
router.put(
  '/change-status/:id/:status',
  verifyToken,
  checkAdminRole,
  changeStatus
);

export default router;
