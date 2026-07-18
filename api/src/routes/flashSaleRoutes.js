import { Router } from "express";
import checkoutController from "../controllers/checkoutController.js";
import checkoutStatusController from "../controllers/checkoutStatusController.js";

const router = Router();

router.post("/checkout", checkoutController);

router.get("/checkout/status/:job_id", checkoutStatusController);


export default router;