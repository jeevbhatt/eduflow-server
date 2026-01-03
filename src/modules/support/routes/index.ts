import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getMyTickets } from "../controllers/getMyTickets.controller";
import { createTicket } from "../controllers/createTicket.controller";
import { getTicketDetails } from "../controllers/getTicketDetails.controller";
import { addMessage } from "../controllers/addTicketMessage.controller";

const router = Router();

router.get("/my", authenticate, getMyTickets);
router.post("/", authenticate, createTicket);
router.get("/detail/:ticketId", authenticate, getTicketDetails);
router.post("/:ticketId/messages", authenticate, addMessage);

export default router;
