import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface FreezingBatch {
  _id: string;
  batchNumber: string;
  dateFrozen: string;
  quantityKgs: number;
  countSize: string;
  location?: string;
  status: 'frozen' | 'packed' | 'partial' | 'exhausted';
  remainingKgs: number;
  notes?: string;
  createdBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function useFreezingBatches(params?: { 
  status?: string; 
  countSize?: string; 
  page?: number; 
  limit?: number;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ['freezing-batches', params],
    queryFn: async () => {
      const { data } = await api.get('/freezing-batches', { params });
      return data;
    },
    staleTime: 30000,
  });
}

export function useFreezingBatch(id: string) {
  return useQuery({
    queryKey: ['freezing-batch', id],
    queryFn: async () => {
      const { data } = await api.get(`/freezing-batches/${id}`);
      return data.data as FreezingBatch;
    },
    enabled: !!id,
    staleTime: 30000,
  });
}

export function useAvailableBatches(countSize: string) {
  return useQuery({
    queryKey: ['freezing-batches', 'available', countSize],
    queryFn: async () => {
      const { data } = await api.get(`/freezing-batches/available/${countSize}`);
      return data.data as FreezingBatch[];
    },
    enabled: !!countSize,
    staleTime: 30000,
  });
}

export function useCreateFreezingBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<FreezingBatch>) => {
      const { data } = await api.post('/freezing-batches', body);
      return data.data as FreezingBatch;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['freezing-batches'] });
      toast.success('Freezing batch created successfully!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create freezing batch'),
  });
}

export function useUpdateFreezingBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<FreezingBatch> & { id: string }) => {
      const { data } = await api.put(`/freezing-batches/${id}`, body);
      return data.data as FreezingBatch;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['freezing-batches'] });
      toast.success('Freezing batch updated!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update freezing batch'),
  });
}

export function useDeleteFreezingBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/freezing-batches/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['freezing-batches'] });
      toast.success('Freezing batch deleted!');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete freezing batch'),
  });
}
