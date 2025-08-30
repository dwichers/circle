'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Task {
   id: number;
   title: string;
   description?: string;
   status: string;
   projectId?: string;
}

export function useTasks(params?: { projectId?: string; status?: string; q?: string }) {
   return useQuery({
      queryKey: ['tasks', params],
      queryFn: async () => {
         const search = new URLSearchParams();
         if (params?.projectId) search.set('projectId', params.projectId);
         if (params?.status) search.set('status', params.status);
         if (params?.q) search.set('q', params.q);
         const query = search.toString();
         return api.get<Task[]>(`/tasks${query ? `?${query}` : ''}`);
      },
   });
}

export function useCreateTask() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (data: Partial<Task>) => api.post<Task>('/tasks', data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
   });
}

export function useUpdateTask() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({ id, ...data }: { id: number } & Partial<Task>) =>
         api.put<Task>(`/tasks/${id}`, data),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
   });
}

export function useCompleteTask() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: number) => api.post<Task>(`/tasks/${id}/complete`, {}),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
   });
}
