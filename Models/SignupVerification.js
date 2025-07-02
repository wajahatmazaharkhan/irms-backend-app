import mongoose from "mongoose";

const SignupVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true // One OTP per email at a time
    },
    otpHash: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    userData: {
        name: String,
        password: String, // already hashed before storing
        mnumber: String,
        department: String,
        startDate: Date,
        EndDate: Date,
        role: {
            type: String,
            enum: ['intern', 'hr'],
            default: 'intern'
        }
    }
}, { timestamps: true });

export default mongoose.model("SignupVerification", SignupVerificationSchema);
