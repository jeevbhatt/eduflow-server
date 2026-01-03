import { NextFunction, Request, Response } from "express";

import prisma from "../../database/prisma";
import { IExtendedRequest } from "../../middleware/type";

// CREATE INSTITUTE (Prisma, static table)
const createInstitute = async (req: IExtendedRequest, res: Response) => {
  const {
    instituteName,
    instituteEmail,
    institutePhoneNumber,
    instituteAddress,
  } = req.body;
  const instituteVatNo = req.body.instituteVatNo || null;
  const institutePanNo = req.body.institutePanNo || null;
  if (
    !instituteName ||
    !instituteEmail ||
    !institutePhoneNumber ||
    !instituteAddress
  ) {
    return res.status(400).json({
      message:
        "Please provide instituteName, instituteEmail, institutePhoneNumber, instituteAddress",
    });
  }
  try {
    const newInstitute = await prisma.institute.create({
      data: {
        instituteName,
        email: instituteEmail,
        phone: institutePhoneNumber,
        address: instituteAddress,
        panNo: institutePanNo,
        vatNo: instituteVatNo,
        owner: req.user ? { connect: { id: req.user.id } } : undefined,
      },
    });
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          currentInstituteNumber: newInstitute.instituteNumber,
          role: "institute",
        },
      });
      req.user.currentInstituteNumber = newInstitute.instituteNumber;
    }
    res.status(201).json({
      message: "Institute created successfully!",
      institute: newInstitute,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error creating institute", error: error.message });
  }
};

export { createInstitute };
