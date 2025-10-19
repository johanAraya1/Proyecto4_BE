"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rankingService_1 = require("../services/rankingService");
// Player ranking routes - leaderboard and player statistics
const router = express_1.default.Router();
router.get("/ranking", async (_req, res) => {
    try {
        const ranking = await (0, rankingService_1.getTop10Players)();
        res.json(ranking);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener el ranking" });
    }
});
exports.default = router;
