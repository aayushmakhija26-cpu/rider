import { describe, it, expect } from 'vitest';
import { createStaffInviteSchema, acceptStaffInviteSchema } from './staff';

describe('Staff Schemas', () => {
  describe('createStaffInviteSchema', () => {
    it('accepts valid email', () => {
      const result = createStaffInviteSchema.safeParse({
        email: 'staff@dealership.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('staff@dealership.com');
      }
    });

    it('trims whitespace from email', () => {
      const result = createStaffInviteSchema.safeParse({
        email: '  staff@dealership.com  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('staff@dealership.com');
      }
    });

    it('rejects invalid email format', () => {
      const result = createStaffInviteSchema.safeParse({
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty email', () => {
      const result = createStaffInviteSchema.safeParse({
        email: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('acceptStaffInviteSchema', () => {
    const validData = {
      name: 'John Doe',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
    };

    it('accepts valid staff invite acceptance data', () => {
      const result = acceptStaffInviteSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.password).toBe('SecurePass123!');
      }
    });

    it('rejects mismatched passwords', () => {
      const result = acceptStaffInviteSchema.safeParse({
        name: 'John Doe',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.confirmPassword?.[0]).toContain(
          'Passwords do not match'
        );
      }
    });

    it('rejects password shorter than 8 characters', () => {
      const result = acceptStaffInviteSchema.safeParse({
        name: 'John Doe',
        password: 'short',
        confirmPassword: 'short',
      });
      expect(result.success).toBe(false);
    });

    it('rejects password longer than 100 characters', () => {
      const longPassword = 'A'.repeat(101);
      const result = acceptStaffInviteSchema.safeParse({
        name: 'John Doe',
        password: longPassword,
        confirmPassword: longPassword,
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty name', () => {
      const result = acceptStaffInviteSchema.safeParse({
        name: '',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      });
      expect(result.success).toBe(false);
    });

    it('rejects name longer than 100 characters', () => {
      const result = acceptStaffInviteSchema.safeParse({
        name: 'A'.repeat(101),
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      });
      expect(result.success).toBe(false);
    });

    it('trims whitespace from name', () => {
      const result = acceptStaffInviteSchema.safeParse({
        name: '  John Doe  ',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
      }
    });
  });
});
