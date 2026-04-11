import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import holdingsRouter from "./holdings";
import dealsRouter from "./deals";
import signalsRouter from "./signals";
import alertsRouter from "./alerts";
import decisionRouter from "./decision";
import adminRouter from "./admin";
import cbnRouter from "./cbn";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(holdingsRouter);
router.use(dealsRouter);
router.use(signalsRouter);
router.use(alertsRouter);
router.use(decisionRouter);
router.use(adminRouter);
router.use(cbnRouter);

export default router;
