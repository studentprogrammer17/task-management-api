export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  role: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface CreateUserByAdminDto {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
}
