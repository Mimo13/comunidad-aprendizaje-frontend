import apiClient from './api';

export interface HeatmapStat {
  date: string;
  count: number;
  covered: number;
}

export interface HeatmapResponse {
  success: boolean;
  data: HeatmapStat[];
  message?: string;
}

export const statsService = {
  getHeatmapStats: async (): Promise<HeatmapResponse> => {
    try {
      const response = await apiClient.get('/stats/heatmap');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching heatmap stats:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Error al obtener estadísticas'
      };
    }
  }
};
