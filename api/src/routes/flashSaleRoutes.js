import { Router } from "express";
import checkoutController from "../controller/checkoutController.js";
import checkoutStatusController from "../controller/checkoutStatusController.js";

const router = Router();

router.post("/checkout", checkoutController);

router.get("/checkout/status/:job_id", checkoutStatusController);

export default router;