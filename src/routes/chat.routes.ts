
import { Router } from "express";
import { sendChatMessage } from "../controllers/chat.controller";
import { authenticate } from "../middlewares/auth.middleware"; // adapte le chemin/nom si différent chez toi

const router = Router();

// Protégé par authentification : seul un utilisateur connecté (admin) peut discuter avec l'assistant
router.post("/", authenticate, sendChatMessage);

export default router;