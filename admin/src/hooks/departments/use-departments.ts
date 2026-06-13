import { useQuery } from '@tanstack/react-query';
import type { Department } from '@/types/location.types';
import { API_BASE_URL } from '@/constants/api-endpoints';

async function fetchDepartments(): Promise<Department[]> {
  const res = await fetch(`${API_BASE_URL}/departments`);
  if (!res.ok) {
    throw new Error('Failed to fetch departments');
  }
  return res.json();
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
  });
}
