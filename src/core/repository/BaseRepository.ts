import prisma from "../database/prisma";

export abstract class BaseRepository<T> {
  protected model: any;

  constructor(modelName: string) {
    this.model = (prisma as any)[modelName];
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    });
  }

  async findMany(params: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    include?: any;
  }): Promise<T[]> {
    return this.model.findMany(params);
  }

  async findFirst(params: {
    where?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
    include?: any;
  }): Promise<T | null> {
    return this.model.findFirst(params);
  }

  async create(data: any): Promise<T> {
    return this.model.create({
      data,
    });
  }

  async update(id: string, data: any): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    return this.model.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async deleteMany(params: { where: any }): Promise<{ count: number }> {
    return this.model.deleteMany(params);
  }

  async count(where?: any): Promise<number> {
    return this.model.count({ where });
  }

  async upsert(id: string, create: any, update: any): Promise<T> {
    return this.model.upsert({
      where: { id },
      create,
      update,
    });
  }
}
