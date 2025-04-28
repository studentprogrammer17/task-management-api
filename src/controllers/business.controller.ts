import { Request, Response } from 'express';
import businessRepository from '../repositories/business.repository';
import { CreateBusinessDto, UpdateBusinessDto } from '../models/business.model';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CustomRequest } from '../middlewares/auth.middleware';
import { BUSINESS_STATUS } from '../enums/business-status.enum';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/businesses'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF are allowed.'));
    }
  },
});

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const handleError = (error: unknown, res: Response): void => {
  if (error instanceof Error) {
    switch (error.message) {
      case 'Business not found':
        res.status(404).json({ success: false, error: 'Business not found' });
        break;
      case 'Business with this email already exists':
        res.status(409).json({
          success: false,
          error: 'Business with this email already exists',
        });
        break;
      case 'Deleting business is forbidden':
        res.status(401).json({
          success: false,
          error: 'Deleting business is forbidden',
        });
        break;
      case 'Updating business is forbidden':
        res.status(401).json({
          success: false,
          error: 'Updating business is forbidden',
        });
        break;
      case 'Invalid file type. Only JPEG, PNG and GIF are allowed.':
        res.status(400).json({ success: false, error: error.message });
        break;
      default:
        res
          .status(500)
          .json({ success: false, error: 'Internal server error' });
    }
  } else {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const sendSuccessResponse = <T>(
  res: Response,
  data: T,
  statusCode: number = 200
): void => {
  res.status(statusCode).json({ success: true, data });
};

export const getAllBusinesses = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const businesses = await businessRepository.getAllBusinesses();
    sendSuccessResponse(res, businesses);
  } catch (error) {
    handleError(error, res);
  }
};

export const getAllUserBusinesses = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = (req.user as { id: string }).id;
    const businesses = await businessRepository.getAllUserBusinesses(userId);
    sendSuccessResponse(res, businesses);
  } catch (error) {
    handleError(error, res);
  }
};

export const getBusinessesByStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const businessStatus: string = req.params.status;
    const businesses = await businessRepository.getBusinessesByStatus(
      businessStatus
    );
    sendSuccessResponse(res, businesses);
  } catch (error) {
    handleError(error, res);
  }
};

export const getUserBusinesses = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = (req.user as { id: string }).id;
    const businesses = await businessRepository.getUserBusinesses(userId);
    sendSuccessResponse(res, businesses);
  } catch (error) {
    handleError(error, res);
  }
};

export const getBusinessById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const businessId = req.params.id;
    const business = await businessRepository.getBusinessById(businessId);
    sendSuccessResponse(res, business);
  } catch (error) {
    handleError(error, res);
  }
};

export const createBusiness = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = (req.user as { id: string }).id;
    const businessData: CreateBusinessDto = {
      name: req.body.name,
      employeeCount: parseInt(req.body.employeeCount),
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      country: req.body.country,
      city: req.body.city,
      description: req.body.description || '',
      image: req.file ? req.file.filename : undefined,
    };

    const requiredFields = [
      'name',
      'employeeCount',
      'phoneNumber',
      'email',
      'country',
      'city',
    ];
    const missingFields = requiredFields.filter(
      field => !businessData[field as keyof CreateBusinessDto]
    );

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
      });
      return;
    }

    const business = await businessRepository.createBusiness(
      businessData,
      userId
    );
    sendSuccessResponse(res, business, 201);
  } catch (error) {
    handleError(error, res);
  }
};

export const updateBusiness = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const businessId = req.params.id;
    const userId = (req.user as { id: string }).id;
    const updateData: UpdateBusinessDto = {
      name: req.body.name,
      employeeCount: req.body.employeeCount
        ? parseInt(req.body.employeeCount)
        : undefined,
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      country: req.body.country,
      city: req.body.city,
      description: req.body.description,
      image: req.file ? req.file.filename : undefined,
    };

    Object.keys(updateData).forEach(
      key =>
        updateData[key as keyof UpdateBusinessDto] === undefined &&
        delete updateData[key as keyof UpdateBusinessDto]
    );

    const business = await businessRepository.updateBusiness(
      businessId,
      userId,
      updateData
    );
    sendSuccessResponse(res, business);
  } catch (error) {
    handleError(error, res);
  }
};

export const changeStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const businessId = req.params.id;
    const status: BUSINESS_STATUS = req.params.status as BUSINESS_STATUS;

    if (!Object.values(BUSINESS_STATUS).includes(status)) {
      res.status(400).json({
        error:
          'Invalid status. Valid statuses are: pending, approved, rejected.',
      });
      return;
    }

    const business = await businessRepository.changeStatus(businessId, status);

    sendSuccessResponse(res, business);
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteBusiness = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = (req.user as { id: string }).id;
    const businessId = req.params.id;
    await businessRepository.deleteBusiness(businessId, userId);
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
};

export const uploadMiddleware = upload.single('image');
