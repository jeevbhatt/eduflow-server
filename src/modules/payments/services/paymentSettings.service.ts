import prisma from "../../../core/database/prisma";

export class PaymentSettingsService {

  async savePaymentConfig(instituteId: string, provider: string, credentials: any, userRole: string) {
    // 1. Validate Provider
    const validProviders = ["khalti", "esewa", "stripe"];
    if (!validProviders.includes(provider)) {
      throw new Error("Invalid payment provider");
    }

    // 2. Local Payment Constraint (Khalti XOR eSewa)
    // Only applies to non-Super Admin (Institutes)
    if (userRole !== "SUPER_ADMIN") {
      if (provider === "khalti" || provider === "esewa") {
        const otherProvider = provider === "khalti" ? "esewa" : "khalti";

        const existingConflict = await prisma.instituteIntegration.findUnique({
          where: {
            instituteId_provider: {
              instituteId,
              provider: otherProvider,
            },
          },
        });

        if (existingConflict && existingConflict.isActive) {
          throw new Error(`Cannot enable ${provider} when ${otherProvider} is active. Only one local payment gateway is allowed.`);
        }
      }
    }

    // 3. Save/Update Configuration
    // We store credentials in 'metadata' (encrypted conceptually, but here plain JSON for now or assumed secure env)
    // For a real prod app, these should be encrypted before storage.
    const integration = await prisma.instituteIntegration.upsert({
      where: {
        instituteId_provider: {
          instituteId,
          provider,
        },
      },
      update: {
        metadata: credentials,
        isActive: true,
      },
      create: {
        instituteId,
        provider,
        metadata: credentials,
        isActive: true,
        accessToken: "", // Not used for Key-based auth
        refreshToken: "",
      },
    });

    return integration;
  }

  async getPaymentConfigs(instituteId: string) {
    return await prisma.instituteIntegration.findMany({
      where: {
        instituteId,
        provider: { in: ["khalti", "esewa", "stripe"] },
      },
      select: {
        provider: true,
        isActive: true,
        // Do not return full metadata (secrets) to frontend
        createdAt: true,
      }
    });
  }
}

export default new PaymentSettingsService();
