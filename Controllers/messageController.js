import Message from '../Models/MessageModel.js';
import connectDB from '../src/db/index.js';

const sendMessage = async (req, res) => {
    await connectDB();
    const { sender, receiver, content } = req.body;

    if (!sender || !receiver || !content) {
        return res.status(400).json({ error: "Sender, receiver, and content are required." });
    }


    try {
        const message = await Message.create({ sender, receiver, content });

        if (!message) {
            return res.status(500).json({ error: "Failed to send message." });
        }

        res.status(201).json({ message: "Message sent successfully.", data: message });

    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Internal server error." });
    }
}

const getMessages = async (req, res) => {
    await connectDB();
    const { userId1, userId2 } = req.params;

    if (!userId1 || !userId2) {
        return res.status(400).json({ error: "Both user IDs are required." });
    }

    try {
        const messages = await Message.find({
            $or: [
                { sender: userId1, receiver: userId2 },
                { sender: userId2, receiver: userId1 }
            ]
        }).sort({ timestamp: 1 });

        if (!messages || messages.length === 0) {
            return res.status(404).json({ error: "No messages found between these users." });
        }

        res.status(200).json({ data: messages });

    } catch (error) {
        console.error("Error retrieving messages:", error);
        res.status(500).json({ error: "Internal server error." });
    }

}

const markMessagesAsSeen = async (req, res) => {
    await connectDB();
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
        return res.status(400).json({ error: "Sender ID and Receiver ID are required." });
    }

    try {
        const result = await Message.updateMany(
            {
                sender: senderId,
                receiver: receiverId,
                seen: false
            },
            { $set: { seen: true, seenAt: new Date() } }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ error: "No unseen messages found to mark as seen." });
        }

        res.status(200).json({ message: "Messages marked as seen" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update seen status" });
    }
}

export {
    sendMessage,
    getMessages,
    markMessagesAsSeen
};