/**
 * Custom hooks for form data management with TanStack Query
 * Features smart caching, optimistic updates, and conflict resolution
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/services/api';
import { queryUtils } from '@/lib/queryClient';
import type {
  FormListResponse,
  FormGetResponse,
  FormCreateRequest,
  FormResponse,
} from '@/services/api';
import { toast } from 'react-hot-toast';

// Query key factory for consistent cache keys
export const formKeys = {
  all: ['forms'] as const,
  lists: () => [...formKeys.all, 'list'] as const,
  list: (pageId: string) => [...formKeys.lists(), pageId] as const,
  details: () => [...formKeys.all, 'detail'] as const,
  detail: (formId: string) => [...formKeys.details(), formId] as const,
  exports: () => [...formKeys.all, 'export'] as const,
  export: (formId: string) => [...formKeys.exports(), formId] as const,
} as const;

/**
 * Hook for fetching a list of forms for a page
 */
export function useFormsQuery(pageId: string, options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) {
  return useQuery({
    queryKey: formKeys.list(pageId),
    queryFn: () => api.listForms(pageId),
    enabled: options?.enabled !== false && !!pageId,
    refetchInterval: options?.refetchInterval,
    meta: {
      description: `Forms list for page ${pageId}`,
    },
  });
}

/**
 * Hook for fetching a specific form
 */
export function useFormQuery(
  pageKey: string,
  formSlug: string,
  options?: {
    enabled?: boolean;
    etag?: string;
  }
) {
  return useQuery({
    queryKey: formKeys.detail(`${pageKey}:${formSlug}`),
    queryFn: async () => {
      try {
        return await api.getForm(pageKey, formSlug, { etag: options?.etag });
      } catch (error) {
        // Handle 304 Not Modified gracefully
        if (error instanceof ApiError && error.status === 304) {
          // Return cached data if available
          const cached = queryUtils.getFormData(`${pageKey}:${formSlug}`);
          if (cached) return cached as FormGetResponse;
        }
        throw error;
      }
    },
    enabled: options?.enabled !== false && !!pageKey && !!formSlug,
    meta: {
      description: `Form ${formSlug} for page ${pageKey}`,
      etag: options?.etag,
    },
  });
}

/**
 * Hook for infinite scrolling of forms (future enhancement)
 */
export function useInfiniteFormsQuery(pageId: string) {
  return useInfiniteQuery({
    queryKey: [...formKeys.list(pageId), 'infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      // This would be implemented when the API supports pagination
      const response = await api.listForms(pageId);
      return {
        forms: response.forms.slice(pageParam * 10, (pageParam + 1) * 10),
        nextPage: response.forms.length > (pageParam + 1) * 10 ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!pageId,
  });
}

/**
 * Hook for creating a new form with optimistic updates
 */
export function useCreateFormMutation(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['createForm'],
    mutationFn: async (data: FormCreateRequest) => {
      return api.createForm(data, {
        idempotencyKey: crypto.randomUUID(), // Generate unique key for each creation
      });
    },
    onMutate: async (newForm) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: formKeys.list(pageId) });

      // Snapshot the previous value
      const previousForms = queryClient.getQueryData<FormListResponse>(formKeys.list(pageId));

      // Optimistically update the forms list
      if (previousForms) {
        const optimisticForm = {
          form_id: `temp-${Date.now()}`,
          form_name: newForm.form_name,
          form_slug: 'creating...',
          version: 1,
          updated_at: new Date().toISOString(),
        };

        queryClient.setQueryData<FormListResponse>(formKeys.list(pageId), {
          ...previousForms,
          forms: [optimisticForm, ...previousForms.forms],
        });
      }

      return { previousForms };
    },
    onError: (err, newForm, context) => {
      // Rollback optimistic update
      if (context?.previousForms) {
        queryClient.setQueryData(formKeys.list(pageId), context.previousForms);
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch forms list
      queryUtils.invalidateForms(pageId);

      // Prefetch the newly created form
      queryClient.prefetchQuery({
        queryKey: formKeys.detail(data.form_id),
        queryFn: () => api.getForm(data.page_id, data.form_slug),
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: formKeys.list(pageId) });
    },
  });
}

/**
 * Hook for updating a form with conflict detection
 */
export function useUpdateFormMutation(formId: string, currentEtag?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateForm', formId],
    mutationFn: async (data: Partial<FormCreateRequest>) => {
      return api.updateForm(formId, data, {
        etag: currentEtag,
        idempotencyKey: crypto.randomUUID(),
      });
    },
    onMutate: async (updatedData) => {
      // Cancel queries for this form
      await queryClient.cancelQueries({ queryKey: formKeys.detail(formId) });

      // Snapshot previous value
      const previousForm = queryClient.getQueryData<FormGetResponse>(formKeys.detail(formId));

      // Optimistically update
      if (previousForm) {
        const optimisticUpdate = {
          ...previousForm,
          form: {
            ...previousForm.form,
            ...updatedData,
            updated_at: new Date().toISOString(),
          },
        };

        queryClient.setQueryData(formKeys.detail(formId), optimisticUpdate);
      }

      return { previousForm };
    },
    onError: (error, updatedData, context) => {
      // Handle specific conflict errors
      if (error instanceof ApiError && error.status === 409) {
        toast.error('This form was modified by someone else. Your changes were not saved. Please refresh and try again.');
      }

      // Rollback optimistic update
      if (context?.previousForm) {
        queryClient.setQueryData(formKeys.detail(formId), context.previousForm);
      }
    },
    onSuccess: (data, variables, context) => {
      // Update the cached data with server response
      queryClient.setQueryData(formKeys.detail(formId), (old: FormGetResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          form: {
            ...old.form,
            version: data.version,
            updated_at: new Date().toISOString(),
          },
        };
      });

      // Also update forms list if the name changed
      if (variables.form_name) {
        queryClient.setQueryData<FormListResponse>(
          formKeys.list(data.page_id),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              forms: old.forms.map(form =>
                form.form_id === formId
                  ? { ...form, form_name: variables.form_name!, version: data.version }
                  : form
              ),
            };
          }
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: formKeys.detail(formId) });
    },
  });
}

/**
 * Hook for deleting a form
 */
export function useDeleteFormMutation(pageId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['deleteForm'],
    mutationFn: (formId: string) => api.deleteForm(formId),
    onMutate: async (formId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: formKeys.list(pageId) });

      // Snapshot the previous value
      const previousForms = queryClient.getQueryData<FormListResponse>(formKeys.list(pageId));

      // Optimistically remove from list
      if (previousForms) {
        queryClient.setQueryData<FormListResponse>(formKeys.list(pageId), {
          ...previousForms,
          forms: previousForms.forms.filter(form => form.form_id !== formId),
        });
      }

      return { previousForms, formId };
    },
    onError: (err, formId, context) => {
      // Rollback the optimistic update
      if (context?.previousForms) {
        queryClient.setQueryData(formKeys.list(pageId), context.previousForms);
      }
    },
    onSuccess: (data, formId) => {
      // Remove the form detail from cache
      queryClient.removeQueries({ queryKey: formKeys.detail(formId) });

      // Invalidate forms list to ensure consistency
      queryUtils.invalidateForms(pageId);
    },
  });
}

/**
 * Hook for exporting form data
 */
export function useExportFormQuery(formId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: formKeys.export(formId),
    queryFn: () => api.exportForm(formId),
    enabled: options?.enabled && !!formId,
    // Long cache time since exports don't change often
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
    meta: {
      description: `Export data for form ${formId}`,
    },
  });
}

/**
 * Utility hook for prefetching related data
 */
export function usePrefetchForms(pageId: string) {
  const queryClient = useQueryClient();

  return {
    prefetchFormsList: () => {
      queryClient.prefetchQuery({
        queryKey: formKeys.list(pageId),
        queryFn: () => api.listForms(pageId),
      });
    },
    prefetchForm: (pageKey: string, formSlug: string) => {
      queryClient.prefetchQuery({
        queryKey: formKeys.detail(`${pageKey}:${formSlug}`),
        queryFn: () => api.getForm(pageKey, formSlug),
      });
    },
  };
}

/**
 * Hook for getting real-time cache statistics
 */
export function useCacheStats() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['cache', 'stats'],
    queryFn: () => queryUtils.getCacheStats(),
    refetchInterval: 5000, // Update every 5 seconds
    enabled: import.meta.env.DEV, // Only in development
  });
}