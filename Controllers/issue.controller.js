import Issues from "../Models/Issues";

export const createIssue = async (req, res) => {
  try {
    const issue = await Issues.create(req.body);
    res.status(201).json({
      success: true,
      message: "Issue submitted successfully",
      issue,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to submit issue",
      error: error.message,
    });
  }
};
