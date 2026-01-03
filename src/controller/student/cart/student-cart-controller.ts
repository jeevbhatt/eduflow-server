import { Response } from "express";
import prisma from "../../../database/prisma";
import { IExtendedRequest } from "../../../middleware/type";

const insertIntoCartTableOfStudent = async (
  req: IExtendedRequest,
  res: Response
) => {
  const userId = req.user?.id;
  const { instituteId, courseId } = req.body;
  if (!instituteId || !courseId) {
    return res.status(400).json({ message: "Please provide instituteId" });
  }
  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "Invalid or missing userId" });
  }
  await prisma.studentCart.create({
    data: {
      userId: String(userId),
      instituteId,
      courseId,
    },
  });
  res.status(200).json({ message: "Course added to cart" });
};

const fetchStudentCartItems = async (req: IExtendedRequest, res: Response) => {
  const userId = req.user?.id;
  const cartItems = await prisma.studentCart.findMany({
    where: { userId: String(userId) },
  });
  res.status(200).json({ message: "Cart fetched", data: cartItems });
};

const deleteStudentCartItem = async (req: IExtendedRequest, res: Response) => {
  const userId = req.user?.id;
  const cartTableId = req.params.cartTableId;
  if (!cartTableId)
    return res.status(400).json({ message: "Please provide cart table id" });
  await prisma.studentCart.deleteMany({
    where: { id: cartTableId, userId: String(userId) },
  });
  res.status(200).json({ message: "Deleted successfully" });
};

export {
  insertIntoCartTableOfStudent,
  fetchStudentCartItems,
  deleteStudentCartItem,
};
