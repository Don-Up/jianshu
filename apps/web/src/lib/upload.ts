// Upload API client functions

export async function uploadImage(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      return { success: false, error: errorData.error || 'Upload failed' };
    }

    const data = await response.json();
    return { success: true, url: data.url };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
  }
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function getImageFileLimit(): number {
  return 5 * 1024 * 1024; // 5MB
}
