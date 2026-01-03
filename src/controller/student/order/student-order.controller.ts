import { Response } from "express";
import prisma from "../../../database/prisma";
import User from "../../../database/models/userModel";
import { IExtendedRequest } from "../../../middleware/type";
import { KhaltiPayment } from "./paymentIntegration";
import axios from "axios";
import generateSha256Hash from "../../../services/generateSha256Hash";
import base64 from "base-64";

// upload.fields([{ name: 'avatar1', maxCount: 1 }, {name:'avatar2', maxCount:1},{name:'avatar3', maxCount : 1}]]

//

enum PaymentMethod {
  COD = "cod",
  ESEWA = "esewa",
  KHALTI = "khalti",
}

enum VerificationStatus {
  Completed = "Completed",
}

const createStudentCourseOrder = async (
  req: IExtendedRequest,
  res: Response
) => {
  const userId = req.user?.id;
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "Invalid or missing userId" });
  }
  const userData = await User.findByPk(userId);
  const { whatsapp_no, remarks, paymentMethod, amount } = req.body;
  const orderDetailsData = req.body.orderDetails;
  if (!orderDetailsData || orderDetailsData.length === 0)
    return res
      .status(400)
      .json({ message: "Please send the course you want to purchase!!!" });
  if (!whatsapp_no || !remarks) {
    return res
      .status(400)
      .json({ message: "Please provide whatsapp_no, remarks" });
  }
  // Create order
  const order = await prisma.studentOrder.create({
    data: {
      userId: String(userId),
      email: userData?.email || "",
      whatsappNo: whatsapp_no,
      remarks,
      orderDetails: {
        create: orderDetailsData.map((od: any) => ({
          courseId: od.courseId,
          instituteId: od.instituteId,
        })),
      },
    },
    include: { orderDetails: true },
  });
  let pidx;
  if (paymentMethod === "esewa") {
    const paymentData = {
      tax_amount: 0,
      product_service_charge: 0,
      product_delivery_charge: 0,
      product_code: process.env.ESEWA_PRODUCT_CODE,
      amount: amount,
      total_amount: amount,
      transaction_uuid: userId + "_" + orderDetailsData[0].courseId,
      success_url: "http://localhost:3000/",
      failure_url: "http://localhost:3000/failure",
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };
    const data = `total_amount=${paymentData.total_amount},transaction_uuid=${paymentData.transaction_uuid},product_code=${paymentData.product_code}`;
    const esewaSecretKey = process.env.ESEWA_SECRET_KEY;
    const signature = generateSha256Hash(data, esewaSecretKey as string);
    const response = await axios.post(
      "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
      { ...paymentData, signature },
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    if (response.status === 200) {
      await prisma.studentPayment.create({
        data: {
          userId: String(userId),
          paymentMethod,
          totalAmount: amount,
          orderId: order.id,
          transactionUuid: paymentData.transaction_uuid,
          paymentStatus: "unpaid",
        },
      });
      return res.status(200).json({
        message: "Payment initiated",
        data: response.request.res.responseUrl,
      });
    }
  } else if (paymentMethod === "khalti") {
    const response = await KhaltiPayment({
      amount: amount,
      return_url: "http://localhost:3000/",
      website_url: "http://localhost:3000/",
      purchase_order_id: orderDetailsData[0].courseId,
      purchase_order_name: "Order_" + orderDetailsData[0].courseId,
    });
    if (response.status === 200) {
      pidx = response.data.pidx;
      await prisma.studentPayment.create({
        data: {
          userId: String(userId),
          paymentMethod,
          totalAmount: amount,
          orderId: order.id,
          pidx,
          paymentStatus: "unpaid",
        },
      });
      return res.status(200).json({ message: "Takethis", data: response.data });
    } else {
      return res
        .status(200)
        .json({ message: "Something went wrong, try again !!" });
    }
  } else if (paymentMethod === "cod") {
    // COD logic if needed
  } else {
    // Stripe or other payment
  }
};

const studentCoursePaymentVerification = async (
  req: IExtendedRequest,
  res: Response
) => {
  const { pidx } = req.body;
  const userId = req.user?.id;
  if (!pidx) return res.status(400).json({ message: "Please provide pidx" });
  const response = await axios.post(
    "https://dev.khalti.com/api/v2/epayment/lookup/",
    { pidx },
    { headers: { Authorization: "Key b68b4f0f4aa84599ad9b91c475ed6833" } }
  );
  const data = response.data;
  if (data.status === "Completed") {
    await prisma.studentPayment.updateMany({
      where: { userId, pidx },
      data: { paymentStatus: "paid" },
    });
    return res.status(200).json({ message: "Payment verified successfully" });
  } else {
    return res.status(500).json({ message: "Payment not verified!!" });
  }
};

const studentCourseEsewaPaymentVerification = async (
  req: IExtendedRequest,
  res: Response
) => {
  const { encodedData } = req.body;
  const userId = req.user?.id;
  if (!encodedData)
    return res
      .status(400)
      .json({ message: "Pleasr provide data base64 for verification" });
  const result = base64.decode(encodedData);
  const newresult = JSON.parse(result);
  const response = await axios.get(
    `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=EPAYTEST&total_amount=${newresult.total_amount}&transaction_uuid=${newresult.transaction_uuid}`
  );
  if (response.status === 200 && response.data.status === "COMPLETE") {
    await prisma.studentPayment.updateMany({
      where: { userId, transactionUuid: newresult.transaction_uuid },
      data: { paymentStatus: "paid" },
    });
    return res.status(200).json({ message: "Payment verified successfully" });
  } else {
    return res.status(500).json({ message: "Not verified" });
  }
};

export {
  createStudentCourseOrder,
  studentCoursePaymentVerification,
  studentCourseEsewaPaymentVerification,
};
