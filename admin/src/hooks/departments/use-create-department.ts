import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/constants/api-endpoints';
import type { Department } from '@/types/location.types';

interface CreateDepartmentPayload {
  code: string;
  name: string;
}

async function createDepartment(payload: CreateDepartmentPayload): Promise<Department> {
  const res = await fetch(`${API_BASE_URL}/departments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('Failed to create department');
  }

  return res.json();
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
}
