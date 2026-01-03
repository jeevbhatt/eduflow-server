import express from "express";
import { Router } from "express";
import {
    createBook,
    getBooks,
    getBookById,
    updateBook,
    deleteBook,
    borrowBook,
    returnBook,
    getStudentBorrowHistory
} from "../../../controller/institute/library/libraryController";
import asyncErrorHandler from "../../../services/asyncErrorHandler";
import { isLoggedIn } from "../../../middleware/middleware";

const router: Router = express.Router();

// Book CRUD operations
router.route("/books")
    .post(isLoggedIn, asyncErrorHandler(createBook))
    .get(isLoggedIn, asyncErrorHandler(getBooks));

router.route("/books/:id")
    .get(isLoggedIn, asyncErrorHandler(getBookById))
    .put(isLoggedIn, asyncErrorHandler(updateBook))
    .delete(isLoggedIn, asyncErrorHandler(deleteBook));

// Borrowing operations
router.route("/borrow")
    .post(isLoggedIn, asyncErrorHandler(borrowBook));

router.route("/return")
    .post(isLoggedIn, asyncErrorHandler(returnBook));

router.route("/history/:studentId")
    .get(isLoggedIn, asyncErrorHandler(getStudentBorrowHistory));

export default router;
