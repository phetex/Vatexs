export const PASSWORD_HINT = 'At least 8 characters, with a letter and a number';

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return 'Password must include at least one letter and one number.';
  return null;
}
