export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  GUEST = "GUEST",
}

export interface UserData {
  userId: string;      // UUID 형식
  loginId: string;     // 아이디
  name: string;        // 이름
  phoneNumber: string; // 전화번호
  role: UserRole;      // 역할
}

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
}

export type LoginResponse = ApiResponse<UserData>;