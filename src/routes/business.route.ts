import express from 'express';
import {
  getAllBusinesses,
  getBusinessById,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  uploadMiddleware,
  getUserBusinesses,
  changeStatus,
  getAllBusinessesByAdmin,
} from '../controllers/business.controller';
import { checkAdminRole, verifyToken } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/', verifyToken, getAllBusinesses);
router.get('/all', verifyToken, checkAdminRole, getAllBusinessesByAdmin);
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
