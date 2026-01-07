import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import paymentSettingsService from "../services/paymentSettings.service";

export const savePaymentConfig = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    const userRole = req.user?.role;
    const { provider, credentials } = req.body;

    if (!instituteId || !userRole) {
      return res.status(400).json({ status: "error", message: "Institute context missing" });
    }

    if (!provider || !credentials) {
      return res.status(400).json({ status: "error", message: "Provider and credentials required" });
    }

    // Sanitize credentials? (handled by service indirectly)

    const integration = await paymentSettingsService.savePaymentConfig(instituteId, provider, credentials, userRole);

    res.json({
      status: "success",
      message: `${provider} configuration saved successfully`,
      data: {
        provider: integration.provider,
        isActive: integration.isActive,
      }
    });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
};

export const getPaymentConfigs = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) return res.status(400).json({ status: "error", message: "Institute ID required" });

    const configs = await paymentSettingsService.getPaymentConfigs(instituteId);
    res.json({ status: "success", data: configs });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
