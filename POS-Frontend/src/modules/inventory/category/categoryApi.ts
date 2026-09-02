
import { categoryAPI } from '../../../api';
// Search and filter categories (backend-driven)
export const searchCategories = (params?: { search?: string; status?: string; sortBy?: string; sortOrder?: number }) => {
	return categoryAPI.search(params || {});
};

export const getCategories = (params?: { search?: string }) => {
	if (params && params.search) {
		return categoryAPI.getAll({ params: { search: params.search } });
	}
	return categoryAPI.getAll();
};
export const getCategoryById = (id: string) => categoryAPI.getById(id);
export const createCategory = (data: any) => categoryAPI.create(data);
export const updateCategory = (id: string, data: any) => categoryAPI.update(id, data);
export const deleteCategory = (id: string) => categoryAPI.delete(id);
