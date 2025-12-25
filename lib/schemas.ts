import * as z from "zod";

/**
 * Schema for Vietnamese phone numbers
 * Accepts formats starting with 84 or 0, followed by valid mobile prefixes (3, 5, 7, 8, 9) and 8 digits.
 */
const validatePhone = (val: string, ctx: z.RefinementCtx) => {
  if (!/^\d+$/.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Số điện thoại chỉ được chứa các ký tự số",
    });
    return;
  }

  if (!val.startsWith("0") && !val.startsWith("84")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Số điện thoại phải bắt đầu bằng 0 hoặc 84",
    });
    return;
  }

  // Length check: 10 if starts with 0, 11 if starts with 84
  if (val.startsWith("0") && val.length !== 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Số điện thoại bắt đầu bằng 0 phải có 10 chữ số",
    });
    return;
  }

  if (val.startsWith("84") && val.length !== 11) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Số điện thoại bắt đầu bằng 84 phải có 11 chữ số",
    });
    return;
  }

  // Network prefix check (3, 5, 7, 8, 9 after the leading 0 or 84)
  const prefix = val.startsWith("84") ? val.slice(2, 3) : val.slice(1, 2);
  if (!["3", "5", "7", "8", "9"].includes(prefix)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Đầu số không hợp lệ (Phải là 03, 05, 07, 08, 09)",
    });
    return;
  }
};

export const phoneSchema = z.string().superRefine(validatePhone);

export const optionalPhoneSchema = z.string().superRefine((val, ctx) => {
  if (!val || val.trim() === "") return;
  validatePhone(val, ctx);
});

/**
 * Schema for passwords
 * Enforces minimum length of 6 characters.
 */
export const passwordSchema = z
  .string()
  .min(6, "Mật khẩu phải có ít nhất 6 ký tự");

/**
 * Schema for general non-empty strings with trim
 */
export const requiredStringSchema = (message: string) =>
  z.string().trim().min(1, message);

/**
 * Factory for birth date validation
 * @param minAge Minimum age requirement
 * @param entityName Name of the entity (e.g., "Học viên", "Nhân viên") for specific error messages
 */
export const getBirthDateSchema = (minAge = 0, entityName = "Ngày sinh") =>
  z.string().superRefine((val, ctx) => {
    if (!val) return;

    const date = new Date(val);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    if (isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngày sinh không hợp lệ",
      });
      return;
    }

    if (checkDate >= today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngày sinh phải là một ngày trong quá khứ",
      });
      return;
    }

    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    let finalAge = age;
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < date.getDate())
    ) {
      finalAge--;
    }

    if (finalAge < minAge || finalAge > 120) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          minAge > 0
            ? `${entityName} phải từ ${minAge} tuổi trở lên`
            : "Tuổi phải trong khoảng từ 0 đến 120",
      });
    }
  });

// Default birthDateSchema for students (minimum 4 years old)
export const birthDateSchema = getBirthDateSchema(4, "Học viên");
