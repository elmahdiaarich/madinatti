import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL;

export const categoriesService = {
  getByModule: async (module) => {
    const res = await axios.get(`${API}/api/categories`, {
      params: module ? { module } : {},
    });
    return res.data; // { success: true, data: [...] }
  },
};
