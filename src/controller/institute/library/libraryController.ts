import { Response } from "express";
import prisma from "../../../database/prisma";
import { IExtendedRequest } from "../../../middleware/type";

/**
 * Library Controller
 * SECURITY: All table names built using buildTableName() for SQL injection prevention
 */

// Create a new book (Prisma)
const createBook = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteId;
  const uploadedBy = req.user?.id;
  const {
    title,
    author,
    isbn,
    categoryId,
    description,
    totalCopies,
    publishedAt,
    coverImage,
  } = req.body;

  if (!title || !author || !isbn || !categoryId) {
    return res
      .status(400)
      .json({ message: "Title, Author, ISBN, and categoryId are required" });
  }

  try {
    await prisma.libraryResource.create({
      data: {
        instituteId,
        categoryId,
        title,
        author,
        isbn,
        description,
        type: "book",
        totalCopies: totalCopies || 1,
        availableCopies: totalCopies || 1,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        thumbnailUrl: coverImage || null,
        uploadedBy,
        status: "available",
      },
    });
    res.status(201).json({ message: "Book added successfully" });
  } catch (err: any) {
    res.status(500).json({ message: "Error adding book", error: err.message });
  }
};

// Get all books with optional filtering (Prisma)
const getBooks = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteId;
  const { search, categoryId, status } = req.query;

  try {
    const where: any = {
      instituteId,
      type: "book",
    };
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: "insensitive" } },
        { author: { contains: search as string, mode: "insensitive" } },
        { isbn: { contains: search as string, mode: "insensitive" } },
      ];
    }
    if (categoryId && categoryId !== "All Categories") {
      where.categoryId = categoryId as string;
    }
    if (status) {
      where.status = status as string;
    }
    const books = await prisma.libraryResource.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ message: "Books fetched", data: books });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error fetching books", error: err.message });
  }
};

// Get single book by ID (Prisma)
const getBookById = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteId;
  const { id } = req.params;
  try {
    const book = await prisma.libraryResource.findFirst({
      where: {
        id,
        instituteId,
        type: "book",
      },
    });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json({ message: "Book fetched", data: book });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error fetching book", error: err.message });
  }
};

// Update a book (Prisma)
const updateBook = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteId;
  const { id } = req.params;
  const {
    title,
    author,
    isbn,
    categoryId,
    description,
    totalCopies,
    publishedAt,
    coverImage,
  } = req.body;
  try {
    const currentBook = await prisma.libraryResource.findFirst({
      where: { id, instituteId, type: "book" },
    });
    if (!currentBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    const borrowed = currentBook.totalCopies - currentBook.availableCopies;
    const newTotal = totalCopies || currentBook.totalCopies;
    const newAvailable = Math.max(0, newTotal - borrowed);
    let newStatus = "available";
    if (newAvailable === 0) newStatus = "out-of-stock";
    else if (newAvailable <= 3) newStatus = "low-stock";
    await prisma.libraryResource.update({
      where: { id },
      data: {
        title: title ?? currentBook.title,
        author: author ?? currentBook.author,
        isbn: isbn ?? currentBook.isbn,
        categoryId: categoryId ?? currentBook.categoryId,
        description:
          description !== undefined ? description : currentBook.description,
        totalCopies: newTotal,
        availableCopies: newAvailable,
        publishedAt: publishedAt
          ? new Date(publishedAt)
          : currentBook.publishedAt,
        thumbnailUrl:
          coverImage !== undefined ? coverImage : currentBook.thumbnailUrl,
        status: newStatus,
      },
    });
    res.status(200).json({ message: "Book updated successfully" });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error updating book", error: err.message });
  }
};

// Delete a book (Prisma)
const deleteBook = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteId;
  const { id } = req.params;
  try {
    const book = await prisma.libraryResource.findFirst({
      where: { id, instituteId, type: "book" },
    });
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    await prisma.libraryResource.delete({ where: { id } });
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error deleting book", error: err.message });
  }
};

// Borrow a book (Prisma)
const borrowBook = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteId;
  const { bookId, studentId, dueDate } = req.body;

  if (!bookId || !studentId) {
    return res
      .status(400)
      .json({ message: "Book ID and Student ID are required" });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const book = await tx.libraryResource.findFirst({
        where: { id: bookId, instituteId, type: "book" },
      });
      if (!book) {
        throw { status: 404, message: "Book not found" };
      }
      if (book.availableCopies <= 0) {
        throw { status: 400, message: "No copies available for borrowing" };
      }
      await tx.libraryBorrow.create({
        data: {
          resourceId: bookId,
          studentId,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          status: "borrowed",
        },
      });
      const newAvailable = book.availableCopies - 1;
      let newStatus = "available";
      if (newAvailable === 0) newStatus = "out-of-stock";
      else if (newAvailable <= 3) newStatus = "low-stock";
      await tx.libraryResource.update({
        where: { id: bookId },
        data: { availableCopies: newAvailable, status: newStatus },
      });
      return true;
    });
    res.status(200).json({ message: "Book borrowed successfully" });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    res
      .status(500)
      .json({ message: "Error borrowing book", error: err.message });
  }
};

// Return a book (Prisma)
const returnBook = async (req: IExtendedRequest, res: Response) => {
  const instituteId = req.user?.currentInstituteId;
  const { borrowId } = req.body;

  if (!borrowId) {
    return res.status(400).json({ message: "Borrow ID is required" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const borrowRecord = await tx.libraryBorrow.findFirst({
        where: { id: borrowId, status: "borrowed" },
      });
      if (!borrowRecord) {
        throw {
          status: 404,
          message: "Borrow record not found or already returned",
        };
      }
      const book = await tx.libraryResource.findFirst({
        where: { id: borrowRecord.resourceId, instituteId, type: "book" },
      });
      if (!book) {
        throw { status: 404, message: "Book not found" };
      }
      await tx.libraryBorrow.update({
        where: { id: borrowId },
        data: { status: "returned", returnedAt: new Date() },
      });
      const newAvailable = book.availableCopies + 1;
      let newStatus = "available";
      if (newAvailable === 0) newStatus = "out-of-stock";
      else if (newAvailable <= 3) newStatus = "low-stock";
      await tx.libraryResource.update({
        where: { id: book.id },
        data: { availableCopies: newAvailable, status: newStatus },
      });
    });
    res.status(200).json({ message: "Book returned successfully" });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    res
      .status(500)
      .json({ message: "Error returning book", error: err.message });
  }
};

// Get borrowing history for a student (Prisma)
const getStudentBorrowHistory = async (
  req: IExtendedRequest,
  res: Response
) => {
  const instituteId = req.user?.currentInstituteId;
  const { studentId } = req.params;
  try {
    const history = await prisma.libraryBorrow.findMany({
      where: {
        studentId,
        resource: { instituteId, type: "book" },
      },
      include: {
        resource: {
          select: { title: true, author: true, isbn: true },
        },
      },
      orderBy: { borrowedAt: "desc" },
    });
    res.status(200).json({ message: "Borrow history fetched", data: history });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Error fetching borrow history", error: err.message });
  }
};

export {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook,
  getStudentBorrowHistory,
};
