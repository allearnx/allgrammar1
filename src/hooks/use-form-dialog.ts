import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface UseFormDialogOptions {
  onSuccess?: () => void;
  logContext: string;
  successMessage?: string;
  errorMessage?: string;
}

export function useFormDialog({ onSuccess, logContext, successMessage, errorMessage }: UseFormDialogOptions) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(
    async <T>(apiCall: () => Promise<T>, resetFn?: () => void): Promise<T | undefined> => {
      setSaving(true);
      try {
        const result = await apiCall();
        if (successMessage) toast.success(successMessage);
        onSuccess?.();
        setOpen(false);
        resetFn?.();
        return result;
      } catch (err) {
        const serverError = err instanceof Error ? err.message : String(err);
        logger.error(logContext, { error: serverError });
        toast.error(errorMessage || serverError, {
          description: errorMessage && serverError !== errorMessage ? serverError : undefined,
        });
        return undefined;
      } finally {
        setSaving(false);
      }
    },
    [onSuccess, logContext, successMessage, errorMessage],
  );

  return { open, setOpen, saving, handleSubmit };
}
