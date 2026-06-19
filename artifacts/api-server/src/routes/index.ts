import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import scamshieldRouter from "./scamshield";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use("/scamshield", scamshieldRouter);

export default router;
