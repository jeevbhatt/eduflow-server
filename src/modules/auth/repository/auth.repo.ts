import { BaseRepository } from "@core/repository/BaseRepository";
import { User } from "@prisma/client";

export class AuthRepo extends BaseRepository<User> {
  constructor() {
    super("user");
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({
      where: { email },
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.model.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
    });
  }

  async createWithProfile(data: any): Promise<User> {
    return this.model.create({
      data,
    });
  }
}

export default new AuthRepo();
