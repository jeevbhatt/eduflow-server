import billingRepo from "../repository/billing.repo";

export class BillingService {
  async addToCart(data: any) {
    return billingRepo.addToCart(data);
  }

  async getCart(studentId: string) {
    return billingRepo.getCart(studentId);
  }

  async createOrder(data: any, items: any[]) {
    return billingRepo.createOrder(data, items);
  }

  async getOrders(studentId: string) {
    return billingRepo.getOrders(studentId);
  }
}

export default new BillingService();
