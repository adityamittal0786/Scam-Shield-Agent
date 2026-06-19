import { Router, type IRouter } from "express";
import healthRouter from "./health";
import scamshieldRouter from "./scamshield";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/scamshield", scamshieldRouter);

export default router;
