import { BaseRepository } from "@core/repository/BaseRepository";
import { StudentOrder, StudentCart } from "@prisma/client";
import prisma from "../../../core/database/prisma";

export class BillingRepo extends BaseRepository<StudentOrder> {
  constructor() {
    super("studentOrder");
  }

  async addToCart(data: { studentId: string; courseId: string; instituteId: string }) {
    return (prisma as any).studentCart.create({
      data,
    });
  }

  async getCart(studentId: string) {
    return (prisma as any).studentCart.findMany({
      where: { studentId },
      include: {
        course: true,
      },
    });
  }

  async createOrder(data: any, items: any[]) {
    return (prisma as any).studentOrder.create({
      data: {
        ...data,
        orderDetails: {
          create: items.map((item) => ({
            courseId: item.courseId,
            price: item.price,
          })),
        },
      },
    });
  }

  async getOrders(studentId: string) {
    return this.model.findMany({
      where: { studentId },
      include: {
        orderDetails: {
          include: { course: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export default new BillingRepo();
