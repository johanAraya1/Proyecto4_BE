import express, { Request, Response } from "express";
import { getTop10Players } from "../services/rankingService";

const router = express.Router();

router.get("/ranking", async (_req: Request, res: Response) => {
  try {
    const ranking = await getTop10Players();
    res.json(ranking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener el ranking" });
  }
});

export default router;