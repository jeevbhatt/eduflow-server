import prisma from "../../../core/database/prisma";
import generateRandomPassword from "../../../core/services/generateRandomPassword";
import sendMail from "../../../core/services/sendMail";
import { Response } from "express";
import { IExtendedRequest as Request } from "../../../core/middleware/type";

export const createTeacher = async (req: Request, res: Response) => {
  const instituteId = req.user?.currentInstituteNumber as string;
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
  } = req.body as any;

  const teacherPhoto = req.file
    ? (req.file as any).path
    : (req.body && req.body.teacherPhoto) ||
      "https://static.vecteezy.com/system/resources/thumbnails/001/840/618/small/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg";

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

export const getTeachers = async (req: Request, res: Response) => {
  const instituteId = (req.user as any)?.currentInstituteNumber as string;
  const teachers = await prisma.teacher.findMany({
    where: { instituteId: String(instituteId) },
    include: { courses: { include: { course: true } } },
  });
  res.status(200).json({ message: "Teachers fetched", data: teachers });
};

export const deleteTeacher = async (req: Request, res: Response) => {
  const instituteId = (req.user as any)?.currentInstituteNumber as string;
  const { id } = req.params;
  await prisma.teacher.deleteMany({
    where: { id, instituteId: String(instituteId) },
  });
  res.status(200).json({ message: "Teacher deleted successfully" });
};
