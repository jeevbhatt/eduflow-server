

import express, { Router } from 'express'
import { createCategory, deleteCategory, getCategories } from '../../../controller/institute/category/categoryController';
import asyncErrorHandler from '../../../services/asyncErrorHandler';
import { isLoggedIn } from '../../../middleware/middleware';

const router:Router = express.Router()


router.route("/").post(isLoggedIn,asyncErrorHandler(createCategory))
.get(isLoggedIn,asyncErrorHandler(getCategories))

router.route("/:id").delete(isLoggedIn,asyncErrorHandler(deleteCategory))

export default router ; 