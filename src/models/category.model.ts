export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface CreateCategoryDto {
  name: string;
}

export interface UpdateCategoryDto {
  name?: string;
}
