import { Response } from "express";
import prisma from "../../../database/prisma";
import { IExtendedRequest } from "../../../middleware/type";
import { buildTableName } from "../../../services/sqlSecurityService";

/**
 * Student Controller
 * SECURITY: All table names are built using buildTableName() to prevent SQL injection
 */

const getStudents = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteNumber;
  const students = await prisma.student.findMany({
    where: { instituteId },
  });
  res.status(200).json({ message: "students fetched", data: students });
};

// Create a new student

const createStudent = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteNumber;
  const {
    firstName,
    lastName,
    studentPhoneNo,
    studentAddress,
    enrolledDate,
    studentImage,
  } = req.body;
  const studentImg = req.file
    ? req.file.path
    : studentImage ||
      "https://static.vecteezy.com/system/resources/thumbnails/001/840/618/small/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg";
  if (
    !firstName ||
    !lastName ||
    !studentPhoneNo ||
    !studentAddress ||
    !enrolledDate
  ) {
    return res.status(400).json({
      message:
        "Enter firstName, lastName, studentPhoneNo, studentAddress, enrolledDate, studentImage",
    });
  }
  try {
    const student = await prisma.student.create({
      data: {
        instituteId,
        firstName,
        lastName,
        phone: studentPhoneNo,
        address: studentAddress,
        enrolledDate: new Date(enrolledDate),
        photo: studentImg,
        email: req.body.email || "",
      },
    });
    res.status(201).json({ message: "Student created", data: student });
  } catch (err: any) {
    console.error("Error inserting student:", err);
    res
      .status(500)
      .json({ message: "Error creating student", error: err.message });
  }
};

// Get all students

const getAllStudents = getStudents;

// Get a single student by ID

const getSingleStudent = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteNumber;
  const { id } = req.params;
  const student = await prisma.student.findFirst({
    where: { id, instituteId },
  });
  if (!student) {
    return res.status(404).json({ message: "Student not found" });
  }
  res.status(200).json({ message: "Student fetched", data: student });
};

// Delete a student by ID

const deleteStudent = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteNumber;
  const { id } = req.params;
  await prisma.student.deleteMany({
    where: { id, instituteId },
  });
  res.status(200).json({ message: "Student deleted" });
};

export {
  getStudents,
  createStudent,
  getAllStudents,
  getSingleStudent,
  deleteStudent,
};
