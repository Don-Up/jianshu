import { z } from 'zod';

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, '昵称不能为空')
    .trim()
    .refine((val) => val.length > 0, {
      message: '昵称不能为空',
    }),
  bio: z.string().optional(),
  avatar: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
});

export const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, '请输入当前密码'),
    newPassword: z.string().min(6, '新密码至少6个字符'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: '两次输入的新密码不一致',
    path: ['confirmPassword'],
  });

export type ProfileFormData = z.infer<typeof profileSchema>;
export type PasswordFormData = z.infer<typeof passwordSchema>;
