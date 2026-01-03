import { Response } from "express";
import { IExtendedRequest } from "../../../middleware/type";
import sequelize from "../../../database/connection";
import { QueryTypes } from "sequelize";
import { buildTableName } from "../../../services/sqlSecurityService";

/**
 * Category Controller
 * SECURITY: All table names built using buildTableName() for SQL injection prevention
 */

const createCategory = async (req: IExtendedRequest, res: Response) => {
    try {
        const instituteNumber = req.user?.currentInstituteNumber;
        const categoryTable = buildTableName('category_', instituteNumber);
        const { categoryName, categoryDescription } = req.body;

        if (!categoryName || !categoryDescription) {
            return res.status(400).json({
                message: "Please provide categoryName and categoryDescription"
            });
        }

        await sequelize.query(
            `INSERT INTO \`${categoryTable}\` (categoryName, categoryDescription) VALUES (?, ?)`,
            {
                type: QueryTypes.INSERT,
                replacements: [categoryName, categoryDescription]
            }
        );

        const categoryData: any = await sequelize.query(
            `SELECT id, createdAt FROM \`${categoryTable}\` WHERE categoryName = ? ORDER BY createdAt DESC LIMIT 1`,
            {
                replacements: [categoryName],
                type: QueryTypes.SELECT
            }
        );

        res.status(200).json({
            message: "Category added successfully",
            data: {
                id: categoryData[0]?.id,
                categoryName,
                categoryDescription,
                createdAt: categoryData[0]?.createdAt
            }
        });
    } catch (err: any) {
        console.error('Error creating category:', err);
        if (err.original?.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Category name must be unique.' });
        }
        res.status(500).json({ message: 'Error creating category', error: err.message });
    }
};

const getCategories = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const categoryTable = buildTableName('category_', instituteNumber);

    const categories = await sequelize.query(
        `SELECT * FROM \`${categoryTable}\``,
        { type: QueryTypes.SELECT }
    );

    res.status(200).json({
        message: "Categories fetched successfully",
        data: categories
    });
};

const deleteCategory = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const categoryTable = buildTableName('category_', instituteNumber);
    const { id } = req.params;

    await sequelize.query(
        `DELETE FROM \`${categoryTable}\` WHERE id = ?`,
        {
            type: QueryTypes.DELETE,
            replacements: [id]
        }
    );

    res.status(200).json({
        message: "Category deleted successfully"
    });
};

export { createCategory, getCategories, deleteCategory };
