import express from 'express';
import {
    sendMessage,
    getMessages,
    markMessagesAsSeen
} from '../Controllers/messageController.js';


const router = express.Router();

router.post("/send", sendMessage);
router.get("/history/:userId1/:userId2", getMessages);
router.post("/mark-seen", markMessagesAsSeen);

export default router;