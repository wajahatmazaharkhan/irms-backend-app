import User from "../Models/User.js";
import { ApiError } from "../src/utils/apiError.js";

export const updateProfile = async (req, res) => {
  try {
    console.log(req.file);
    console.log(req.body);
    // Try to get the user id from auth middleware first,
    // otherwise fall back to body/params if you prefer that style.
    const userId =
      req.user?.id || req.user?._id || req.body.userId || req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User id is missing.",
      });
    }

    // These are the fields sent from Profile.jsx
    const {
      fullName,
      email,
      studying, // not used in model (ignored)
      currentRole,
      phoneNumber,
      countryCode, // not used in model (ignored)
      linkedInURL,
      bio,
      profileCompletion,
    } = req.body;

    const updates = {};

    // Map frontend fields -> User model fields
    if (typeof fullName === "string") {
      updates.name = fullName.trim();
    }

    if (typeof email === "string") {
      updates.email = email.trim().toLowerCase();
    }

    // Current role -> role (only if you actually want to allow changing it)
    if (typeof currentRole === "string" && currentRole.trim() !== "") {
      updates.role = currentRole.trim();
    }

    // Phone number -> mnumber
    if (typeof phoneNumber === "string") {
      // You can sanitize/strip spaces if you want:
      updates.mnumber = phoneNumber.trim();
    }

    // Priority 1: Uploaded image (Cloudinary)
    if (req.file) {
      updates.profilePicture = req.file.path;
    }
    // Priority 2: Existing image URL (NO new upload)
    else if (
      typeof profilePicture === "string" &&
      profilePicture.trim() !== ""
    ) {
      updates.profilePicture = profilePicture.trim();
    }

    if (typeof linkedInURL === "string" && linkedInURL.trim() !== "") {
      updates.linkedInURL = linkedInURL.trim();
    }

    if (typeof bio === "string" && bio.trim() !== "") {
      updates.bio = bio.trim();
    }

    if (profileCompletion !== undefined) {
      const completion = Number(profileCompletion);

      if (!Number.isNaN(completion)) {
        updates.profileCompletion = completion;
      }
    }

    // NOTE: `bio`, `studying`, `countryCode` are NOT in your User schema,
    // so we don't save them. You can add those fields to the schema if needed.

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided to update.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("🚀 ~ updateProfile ~ error:", error);
    return res
      .status(500)
      .json(new ApiError(500, "internal server error", error));
  }
};
