import { Request, Response } from "express";
import categoryRepository from "../repositories/category.repository";
import { CreateCategoryDto, UpdateCategoryDto } from "../models/category.model";
import { CustomRequest } from "../middlewares/auth.middleware";

export const getAllCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await categoryRepository.getAllCategories();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve categories" });
  }
};


export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categoryId = req.params.id;
    const category = await categoryRepository.getCategoryById(categoryId);
    res.status(200).json(category);
  } catch (error) {
    if (error instanceof Error && error.message === "Category not found") {
      res.status(404).json({ error: "Category not found" });
    } else {
      res.status(500).json({ error: "Failed to retrieve category" });
    }
  }
};

export const getTasksByCategory = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const categoryId = req.params.id;
    const userId = (req.user as { id: string }).id;
    const tasks = await categoryRepository.tasksByCategory(categoryId, userId);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve tasks" });
  }
};

export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categoryData: CreateCategoryDto = req.body;

    if (!categoryData.name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    const category = await categoryRepository.createCategory(categoryData);
    res.status(201).json(category);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Such category already exist"
    ) {
      res.status(500).json({ error: "Such category already exist" });
    } else {
      res.status(500).json({ error: "Failed to create category" });
    }
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categoryId = req.params.id;
    const updateData: UpdateCategoryDto = req.body;

    const category = await categoryRepository.updateCategory(
      categoryId,
      updateData
    );
    res.status(200).json(category);
  } catch (error) {
    if (error instanceof Error && error.message === "Category not found") {
      res.status(404).json({ error: "Category not found" });
    } else if (
      error instanceof Error &&
      error.message === "Such category already exist"
    ) {
      res.status(500).json({ error: "Such category already exist" });
    } else {
      res.status(500).json({ error: "Failed to update category" });
    }
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categoryId = req.params.id;
    await categoryRepository.deleteCategory(categoryId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === "Category not found") {
      res.status(404).json({ error: "Category not found" });
    } else if (
      error instanceof Error &&
      error.message === "Category cant be delete because it has related tasks"
    ) {
      res.status(500).json({
        error: "Category cant be delete because it has related tasks",
      });
    } else {
      res.status(500).json({ error: "Failed to delete category" });
    }
  }
};
