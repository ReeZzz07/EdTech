import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createPremiumMonthInvoiceLink, getPremiumOfferPublicInfo } from "../services/telegramPaymentsService";
import { asyncHandler } from "../utils/asyncHandler";

export const paymentsRouter = Router();

paymentsRouter.get(
  "/premium/info",
  asyncHandler(async (_req, res) => {
    res.json(getPremiumOfferPublicInfo());
  }),
);

paymentsRouter.post(
  "/premium/invoice",
  requireAuth,
  asyncHandler(async (req, res) => {
    const invoiceLink = await createPremiumMonthInvoiceLink(req.authUserId!);
    res.json({ invoiceLink });
  }),
);
