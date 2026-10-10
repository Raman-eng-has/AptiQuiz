import { describe, it, expect } from 'vitest';
import { UserRole, QuestionType, Difficulty } from '@aptiquiz/shared';
import { isHostOrAdmin, hasRole } from './auth';

describe('Frontend Auth Utilities', () => {
  it('should define UserRoles properly', () => {
    expect(UserRole.STUDENT).toBe('STUDENT');
    expect(UserRole.HOST).toBe('HOST');
    expect(UserRole.COLLEGE_ADMIN).toBe('COLLEGE_ADMIN');
    expect(UserRole.SUPER_ADMIN).toBe('SUPER_ADMIN');
  });

  it('should check role permissions accurately', () => {
    expect(isHostOrAdmin()).toBe(false); // default when unauthenticated
  });
});
