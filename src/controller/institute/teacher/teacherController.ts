import { Response } from "express";
import { IExtendedRequest } from "../../../middleware/type";
import prisma from "../../../database/prisma";
import generateRandomPassword from "../../../services/generateRandomPassword";
import sendMail from "../../../services/sendMail";

/**
 * Teacher Controller (Institute-level)
 * SECURITY: All table names are built using buildTableName() to prevent SQL injection
 */

const createTeacher = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteNumber;
  if (!instituteId || typeof instituteId !== "string") {
    return res.status(400).json({ message: "Invalid or missing instituteId" });
  }
  const {
    firstName,
    lastName,
    teacherEmail,
    teacherPhoneNumber,
    teacherExperience,
    teacherSalary,
    teacherJoinedDate,
    courseId,
  } = req.body;
  const teacherPhoto = req.file
    ? req.file.path
    : "https://static.vecteezy.com/system/resources/thumbnails/001/840/618/small/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg";

  if (
    !firstName ||
    !lastName ||
    !teacherEmail ||
    !teacherPhoneNumber ||
    !teacherExperience ||
    !teacherSalary ||
    !teacherJoinedDate ||
    !courseId
  ) {
    return res.status(400).json({
      message:
        "Please provide firstName, lastName, teacherEmail, teacherPhoneNumber, teacherExperience, teacherSalary, teacherJoinedDate, courseId",
    });
  }

  // Generate password
  const data = generateRandomPassword(`${firstName} ${lastName}`);
  const teacher = await prisma.teacher.create({
    data: {
      instituteId: String(instituteId),
      firstName,
      lastName,
      email: teacherEmail,
      phone: teacherPhoneNumber,
      experience: parseInt(teacherExperience, 10),
      salary: parseFloat(teacherSalary),
      joinedDate: new Date(teacherJoinedDate),
      photo: teacherPhoto,
      courses: {
        create: [{ courseId }],
      },
    },
  });

  // Send welcome email
  const mailInformation = {
    to: teacherEmail,
    subject: "Welcome to EduFlow",
    text: `You've registered successfully.\n\nEmail: ${teacherEmail}\nPassword: ${data.plainVersion}\nInstitute Number: ${instituteId}`,
    html: `
            <div style="font-family: Arial, sans-serif;">
                <h2>Welcome to EduFlow!</h2>
                <p>You've been registered as a teacher.</p>
                <p><strong>Email:</strong> ${teacherEmail}</p>
                <p><strong>Password:</strong> ${data.plainVersion}</p>
                <p><strong>Institute Number:</strong> ${instituteId}</p>
                <p style="color: #666;">Please change your password after first login.</p>
            </div>
        `,
  };
  await sendMail(mailInformation);

  res.status(200).json({
    message: "Teacher created successfully",
    data: teacher,
  });
};

const getTeachers = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteNumber;

  const teachers = await prisma.teacher.findMany({
    where: { instituteId: String(instituteId) },
    include: { courses: { include: { course: true } } },
  });

  res.status(200).json({
    message: "Teachers fetched",
    data: teachers,
  });
};

const deleteTeacher = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteNumber;
  const { id } = req.params;

  await prisma.teacher.deleteMany({
    where: { id, instituteId: String(instituteId) },
  });

  res.status(200).json({
    message: "Teacher deleted successfully",
  });
};

export { createTeacher, getTeachers, deleteTeacher };
