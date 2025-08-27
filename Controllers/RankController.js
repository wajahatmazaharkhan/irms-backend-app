import mongoose from "mongoose";
import User from "../Models/User.js";
import connectDB from "../src/db/index.js";

export const getInternRankings = async function (req, res) {
  await connectDB();
  try {
    const interns = await User.find({ role: "intern" })
      .select("name email totalPoints department")
      .sort({ totalPoints: -1 });

    res.status(200).json({ interns });
  } catch (error) {
    console.error("Error fetching intern rankings:", error);
    res.status(500).json({ message: "Server error"});
}
};