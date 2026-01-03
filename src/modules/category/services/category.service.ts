import { Category } from "@generated/prisma";
import categoryRepo from "../repository/category.repo";

export class CategoryService {
  async getAllCategories(instituteId: string) {
    return categoryRepo.findByInstitute(instituteId);
  }

  async getCategoryById(id: string) {
    return categoryRepo.findById(id);
  }

  async createCategory(data: any) {
    const existing = await categoryRepo.findByName(data.categoryName, data.instituteId);
    if (existing) {
      throw new Error("Category already exists in this institute");
    }
    return categoryRepo.create(data);
  }

  async updateCategory(id: string, data: Partial<Category>) {
    return categoryRepo.update(id, data);
  }

  async deleteCategory(id: string) {
    return categoryRepo.delete(id);
  }
}

export default new CategoryService();
