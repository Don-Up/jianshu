import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadImage, isImageFile, getImageFileLimit } from '../upload';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('upload utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isImageFile', () => {
    it('should return true for image types', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      const gifFile = new File([''], 'test.gif', { type: 'image/gif' });
      const webpFile = new File([''], 'test.webp', { type: 'image/webp' });

      expect(isImageFile(jpegFile)).toBe(true);
      expect(isImageFile(pngFile)).toBe(true);
      expect(isImageFile(gifFile)).toBe(true);
      expect(isImageFile(webpFile)).toBe(true);
    });

    it('should return false for non-image types', () => {
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      const textFile = new File([''], 'test.txt', { type: 'text/plain' });

      expect(isImageFile(pdfFile)).toBe(false);
      expect(isImageFile(textFile)).toBe(false);
    });
  });

  describe('getImageFileLimit', () => {
    it('should return 5MB limit', () => {
      expect(getImageFileLimit()).toBe(5 * 1024 * 1024);
    });
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://cdn.example.com/image.jpg' }),
      });

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadImage(file);

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://cdn.example.com/image.jpg');
      expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        body: expect.any(FormData),
      });
    });

    it('should handle upload failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'File too large' }),
      });

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadImage(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('File too large');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = await uploadImage(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should send file as FormData', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://cdn.example.com/image.jpg' }),
      });

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      await uploadImage(file);

      expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        body: expect.any(FormData),
      });

      // Verify FormData contains the file
      const formData = mockFetch.mock.calls[0][1].body as FormData;
      expect(formData.get('file')).toBe(file);
    });
  });
});
