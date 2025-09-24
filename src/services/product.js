import api from './api';

export const productService = {
  list: (params) => api.get('/products', { params }),
};


