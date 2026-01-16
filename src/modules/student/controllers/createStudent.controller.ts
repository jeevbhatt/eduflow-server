import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentService from "../services/student.service";

export const createStudent = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    if (!instituteId) throw new Error("Institute context required");

    const {
      firstName,
      lastName,
      studentPhoneNo,
      studentAddress,
      enrolledDate,
      email
    } = req.body;

    if (!firstName || !lastName || !studentPhoneNo || !studentAddress) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const studentData = {
      firstName,
      lastName,
      phone: studentPhoneNo,
      address: studentAddress,
      enrolledDate,
      email: email || "",
    };

    const student = await studentService.createStudent(instituteId, studentData, req.file);
    res.status(201).json({ status: "success", data: student });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
