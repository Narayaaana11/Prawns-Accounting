import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

interface IntakeData {
  farmerName: string;
  paymentMethod: string;
  countValue: string;
  weight: number;
  amountPerKg: number;
}

export function useCreateIntake() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: IntakeData) => {
      const res = await api.post('/intake', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useUpdateIntake() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: IntakeData }) => {
      const res = await api.put(`/intake/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

export function useDeleteIntake() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/intake/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}
