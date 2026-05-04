import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const condition = true;
    const result = cn('foo', condition && 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle false conditions', () => {
    const condition = false;
    const result = cn('foo', condition && 'bar');
    expect(result).toBe('foo');
  });

  it('should merge tailwind classes intelligently', () => {
    const result = cn('px-2 px-4');
    expect(result).toBe('px-4');
  });

  it('should handle multiple inputs', () => {
    const result = cn('foo', 'bar', 'baz');
    expect(result).toBe('foo bar baz');
  });
});
