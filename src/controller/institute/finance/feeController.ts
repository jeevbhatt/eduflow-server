import { Response } from "express";
import sequelize from "../../../database/connection";
import { IExtendedRequest } from "../../../middleware/type";
import { QueryTypes } from "sequelize";
import { buildTableName } from "../../../services/sqlSecurityService";

/**
 * Fee Controller
 * SECURITY: All table names built using buildTableName() for SQL injection prevention
 */

// Define a new fee structure (e.g., Tuition Fee - $500 - Monthly)
const createFeeStructure = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const feeStructureTable = buildTableName('fee_structure_', instituteNumber);
    const { name, amount, frequency, description } = req.body;

    if (!name || !amount) {
        return res.status(400).json({ message: "Name and Amount are required" });
    }

    try {
        await sequelize.query(
            `INSERT INTO \`${feeStructureTable}\` (name, amount, frequency, description) VALUES (?, ?, ?, ?)`,
            {
                replacements: [name, amount, frequency || 'monthly', description || null],
                type: QueryTypes.INSERT
            }
        );
        res.status(201).json({ message: "Fee structure created successfully" });
    } catch (err: any) {
        res.status(500).json({ message: "Error creating fee structure", error: err.message });
    }
};

// Get all fee structures
const getFeeStructures = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const feeStructureTable = buildTableName('fee_structure_', instituteNumber);

    try {
        const structures = await sequelize.query(
            `SELECT * FROM \`${feeStructureTable}\` ORDER BY createdAt DESC`,
            { type: QueryTypes.SELECT }
        );
        res.status(200).json({ data: structures });
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching fee structures", error: err.message });
    }
};

// Record a payment for a student
const recordPayment = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const feeStructureTable = buildTableName('fee_structure_', instituteNumber);
    const feePaymentTable = buildTableName('fee_payment_', instituteNumber);
    const { studentId, feeStructureId, amountPaid, paymentDate, paymentMethod, remarks } = req.body;

    if (!studentId || !feeStructureId || !amountPaid || !paymentDate) {
        return res.status(400).json({ message: "Missing required payment fields" });
    }

    try {
        // 1. Get total amount from structure
        const structure: any = await sequelize.query(
            `SELECT amount FROM \`${feeStructureTable}\` WHERE id = ?`,
            { replacements: [feeStructureId], type: QueryTypes.SELECT }
        );

        if (structure.length === 0) {
            return res.status(404).json({ message: "Fee structure not found" });
        }

        const totalAmount = structure[0].amount;

        // 2. Check previous payments to calculate balance
        const previousPayments: any = await sequelize.query(
            `SELECT SUM(amountPaid) as totalPaid FROM \`${feePaymentTable}\`
             WHERE studentId = ? AND feeStructureId = ?`,
            { replacements: [studentId, feeStructureId], type: QueryTypes.SELECT }
        );

        const totalPaidSoFar = previousPayments[0].totalPaid || 0;
        const newBalance = totalAmount - (parseFloat(totalPaidSoFar) + parseFloat(amountPaid));
        const status = newBalance <= 0 ? 'paid' : 'partial';

        // 3. Insert payment record
        const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;

        await sequelize.query(
            `INSERT INTO \`${feePaymentTable}\`
            (studentId, feeStructureId, amountPaid, balance, paymentDate, paymentMethod, status, receiptNumber, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            {
                replacements: [
                    studentId, feeStructureId, amountPaid, newBalance,
                    paymentDate, paymentMethod || 'cash', status, receiptNumber, remarks || null
                ],
                type: QueryTypes.INSERT
            }
        );

        res.status(201).json({
            message: "Payment recorded successfully",
            receiptNumber,
            balance: newBalance
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error recording payment", error: err.message });
    }
};

// Get payment history for a student
const getStudentPayments = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const feePaymentTable = buildTableName('fee_payment_', instituteNumber);
    const feeStructureTable = buildTableName('fee_structure_', instituteNumber);
    const { studentId } = req.params;

    try {
        const payments = await sequelize.query(
            `SELECT p.*, s.name as feeName, s.amount as totalAmount
             FROM \`${feePaymentTable}\` as p
             JOIN \`${feeStructureTable}\` as s ON p.feeStructureId = s.id
             WHERE p.studentId = ?
             ORDER BY p.paymentDate DESC`,
            {
                replacements: [studentId],
                type: QueryTypes.SELECT
            }
        );
        res.status(200).json({ data: payments });
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching student payments", error: err.message });
    }
};

// Get finance overview stats
const getFinanceStats = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const feePaymentTable = buildTableName('fee_payment_', instituteNumber);
    const studentTable = buildTableName('student_', instituteNumber);

    try {
        const stats: any = await sequelize.query(
            `SELECT
                SUM(amountPaid) as totalCollected,
                COUNT(id) as totalTransactions,
                (SELECT SUM(balance) FROM \`${feePaymentTable}\` WHERE status != 'paid') as totalPending
             FROM \`${feePaymentTable}\``,
            { type: QueryTypes.SELECT }
        );

        const recentPayments = await sequelize.query(
            `SELECT p.*, st.studentName
             FROM \`${feePaymentTable}\` as p
             JOIN \`${studentTable}\` as st ON p.studentId = st.id
             ORDER BY p.createdAt DESC LIMIT 5`,
            { type: QueryTypes.SELECT }
        );

        res.status(200).json({
            stats: stats[0],
            recentPayments
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching finance stats", error: err.message });
    }
};

export {
    createFeeStructure,
    getFeeStructures,
    recordPayment,
    getStudentPayments,
    getFinanceStats
};
