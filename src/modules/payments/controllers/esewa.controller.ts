import { Response, Request } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import esewaService from "../services/esewa.service";

export const initiateEsewaPayment = async (req: Request, res: Response) => {
  try {
    const { amount, transactionId, successUrl, failureUrl } = req.body as any;
    const instituteId = (req as any).instituteId;

    if (!amount || !transactionId) {
      return res.status(400).json({ status: "error", message: "Amount and Transaction ID required" });
    }

    const config = await esewaService.getPaymentConfig(
      amount,
      transactionId,
      successUrl || `${process.env.FRONTEND_URL}/payment/success`,
      failureUrl || `${process.env.FRONTEND_URL}/payment/failure`,
      instituteId
    );

    res.json(config);
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const handleEsewaSuccess = async (req: Request, res: Response) => {
  // eSewa redirects here with encoded query param 'data'
  const { data } = req.query;

  try {
    if (!data) return res.status(400).send("No data received");

    const decodedBuffer = Buffer.from(data as string, "base64");
    const decodedJson = JSON.parse(decodedBuffer.toString("utf-8"));

    // decodedJson: { status, signature, transaction_code, total_amount, ... }

    if (decodedJson.status === "COMPLETE") {
       console.log(`eSewa TSX Success: ${decodedJson.transaction_code}`);
       // Update DB logic here
    }

    res.redirect(`${process.env.FRONTEND_URL}/payment/success?ref=${decodedJson.transaction_code}`);
  } catch (error: any) {
    console.error("eSewa Callback Error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/payment/failure`);
  }
};
