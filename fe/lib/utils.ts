import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility function to split full name into first and last name
export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  //xóa khoảng trống đầu cuối
  const names = fullName.trim().split(" ");
  if (names.length === 1) {
    return { firstName: names[0], lastName: "" };
  }

  const lastName = names.pop() || "";
  const firstName = names.join(" ");

  return { firstName, lastName };
}

// Validation functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("Mật khẩu phải có ít nhất 6 ký tự");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
