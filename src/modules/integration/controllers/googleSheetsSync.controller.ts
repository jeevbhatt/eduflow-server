import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import googleSheetsService from "../services/googleSheets.service";

export const syncDataToSheet = async (req: IExtendedRequest, res: Response) => {
  try {
    const instituteId = req.instituteId;
    const { spreadsheetId, sheetName, data } = req.body;

    if (!instituteId || !spreadsheetId || !data) {
      return res.status(400).json({ status: "error", message: "Missing required fields" });
    }

    // data should be an array of arrays
    await googleSheetsService.appendRows(instituteId, spreadsheetId, `${sheetName}!A1`, data);

    res.json({ status: "success", message: "Data synced successfully" });
  } catch (error: any) {
    console.error("Sync Error:", error.message);
    res.status(500).json({ status: "error", message: error.message });
  }
};
