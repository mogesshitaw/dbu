// src/types/index.ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: "student"|"admin" | "department_head" | "instructor";
  department_id: number;
  department_name?: string;
  idNumber: string;
  username: string;
  status: "Active" | "Deactivated";
}

export interface Department {
  department_id: number;
  department_name: string;
}

export interface UsersState {
  users: User[];
  departments: Department[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}