import libraryRepo from "../repository/library.repo";
import prisma from "../../../core/database/prisma";
import firebaseStorage from "../../../core/services/firebaseStorage";

export class LibraryService {
  async getBooks(instituteId: string, filters: any) {
    return libraryRepo.findByInstitute(instituteId, { ...filters, type: "book" });
  }

  async getResourceById(id: string, instituteId: string) {
    return libraryRepo.findFirst({ where: { id, instituteId } });
  }

  async createResource(instituteId: string, userId: string, data: any, file?: any) {
    if (file) {
      data.thumbnailUrl = await firebaseStorage.uploadFile(
        file.buffer,
        `library/thumbnails/${Date.now()}-${file.originalname}`,
        file.mimetype
      );
    }

    return libraryRepo.create({
      ...data,
      instituteId,
      uploadedBy: userId,
      availableCopies: data.totalCopies || 1,
      totalCopies: data.totalCopies || 1,
      status: "available",
    });
  }

  async updateResource(id: string, instituteId: string, data: any, file?: any) {
    const current = await libraryRepo.findFirst({ where: { id, instituteId } });
    if (!current) throw new Error("Resource not found");

    if (file) {
      data.thumbnailUrl = await firebaseStorage.uploadFile(
        file.buffer,
        `library/thumbnails/${Date.now()}-${file.originalname}`,
        file.mimetype
      );
    }

    // Adjust availability if total copies changed
    if (data.totalCopies !== undefined) {
      const borrowed = current.totalCopies - current.availableCopies;
      data.availableCopies = Math.max(0, data.totalCopies - borrowed);
      data.status = data.availableCopies === 0 ? "out-of-stock" : (data.availableCopies <= 3 ? "low-stock" : "available");
    }

    return libraryRepo.update(id, data);
  }

  async deleteResource(id: string, instituteId: string) {
    return libraryRepo.deleteMany({ where: { id, instituteId } });
  }

  async borrowResource(resourceId: string, studentId: string, instituteId: string, dueDate: Date) {
    return prisma.$transaction(async (tx: any) => {
      const resource = await tx.libraryResource.findFirst({
        where: { id: resourceId, instituteId },
      });

      if (!resource) throw new Error("Resource not found");
      if (resource.availableCopies <= 0) throw new Error("No copies available");

      const borrow = await tx.libraryBorrow.create({
        data: {
          resourceId,
          studentId,
          dueDate,
          status: "borrowed",
        },
      });

      const newAvailable = resource.availableCopies - 1;
      await tx.libraryResource.update({
        where: { id: resourceId },
        data: {
          availableCopies: newAvailable,
          status: newAvailable === 0 ? "out-of-stock" : (newAvailable <= 3 ? "low-stock" : "available")
        },
      });

      return borrow;
    });
  }

  async returnResource(borrowId: string, instituteId: string) {
    return prisma.$transaction(async (tx: any) => {
      const borrow = await tx.libraryBorrow.findFirst({
        where: { id: borrowId, status: "borrowed" },
        include: { resource: true }
      });

      if (!borrow || borrow.resource.instituteId !== instituteId) {
        throw new Error("Active borrow record not found");
      }

      await tx.libraryBorrow.update({
        where: { id: borrowId },
        data: { status: "returned", returnedAt: new Date() },
      });

      const newAvailable = borrow.resource.availableCopies + 1;
      await tx.libraryResource.update({
        where: { id: borrow.resourceId },
        data: {
          availableCopies: newAvailable,
          status: newAvailable === 0 ? "out-of-stock" : (newAvailable <= 3 ? "low-stock" : "available")
        }
      });
    });
  }

  async getStudentHistory(studentId: string, instituteId: string) {
    return libraryRepo.findBorrowHistory(studentId, instituteId);
  }
}

export default new LibraryService();
