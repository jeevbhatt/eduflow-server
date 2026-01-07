import { Response, Request } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import khaltiService from "../services/khalti.service";

export const initiateKhaltiPayment = async (req: Request, res: Response) => {
  try {
    const { amount, orderId, orderName, returnUrl, websiteUrl } = req.body as any;
    const instituteId = (req as any).instituteId; // Check IExtendedRequest

    if (!amount || !orderId) {
      return res.status(400).json({ status: "error", message: "Amount and Order ID required" });
    }

    const payload = {
      return_url: returnUrl || `${process.env.FRONTEND_URL}/payment/khalti/callback`,
      website_url: websiteUrl || process.env.FRONTEND_URL || "http://localhost:3000",
      amount: amount * 100, // Convert Rs to paisa
      purchase_order_id: orderId,
      purchase_order_name: orderName || "Product Purchase",
    };

    const data = await khaltiService.initiatePayment(payload, instituteId);

    res.json({
      pidx: data.pidx,
      payment_url: data.payment_url,
    });
  } catch (error: any) {
    console.error("Khalti Init Error:", error.response?.data || error.message);
    res.status(500).json({ status: "error", message: "Failed to initiate Khalti payment" });
  }
};

export const verifyKhaltiPayment = async (req: Request, res: Response) => {
  try {
    const { pidx } = req.body;

    if (!pidx) return res.status(400).json({ status: "error", message: "PIDX required" });

    const verification = await khaltiService.verifyPayment(pidx);

    if (verification.status === "Completed") {
      // Logic to update database status = 'paid'
      console.log(`Payment verify success: ${pidx}`);
    }

    res.json(verification);
  } catch (error: any) {
    console.error("Khalti Verify Error:", error.response?.data || error.message);
    res.status(500).json({ status: "error", message: "Failed to verify payment" });
  }
};
