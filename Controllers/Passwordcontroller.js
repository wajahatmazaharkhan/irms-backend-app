import bcrypt from 'bcrypt';
import User from "../Models/User.js";
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};


const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"Account Recovery" <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};


export const sendResetOtp = async (req, res) => {
    try {
        const { email } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP before saving
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        // Set OTP and expiry (10 minutes)
        user.resetPasswordOtp = hashedOtp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Prepare email
        const emailOptions = {
            to: email,
            subject: 'Password Reset OTP',
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px">
            <h2 style="color: #333; text-align: center">Password Reset</h2>
            <p>Hello,</p>
            <p>We received a password reset request. Please use the following code to proceed:</p>
            <div style="background: #f2f2f2; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin-bottom: 20px">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore or contact support.</p>
            <p>Thank you</p>
          </div> 
        `
        };

        // Send email
        await sendEmail(emailOptions);

        res.status(200).json({ message: 'Reset OTP Sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to send reset OTP' });
    }
};

export const verifyResetOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find user by email
        const user = await User.findOne({
            email,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Reset password request invalid or expire' });
        }

        // Check if OTP is correct
        const isOtpValid = await bcrypt.compare(otp, user.resetPasswordOtp);
        if (!isOtpValid) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        res.status(200).json({ message: 'OTP is correct. You may reset your password now' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to verify OTP' });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        // Find user by email
        const user = await User.findOne({
            email,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Reset password request invalid or expire' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset fields
        user.password = hashedPassword;
        user.resetPasswordOtp = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to reset password' });
    }
};




// export const userPassUpdate = async (req, res) => {
//     const { email, oldPassword, newPassword, cnewPassword } = req.body;

//     // Validate input fields
//     if (!email || !oldPassword || !newPassword || !cnewPassword) {
//         return res.status(400).json({ message: 'All fields are required' });
//     }

//     // Check if new password and confirmation password match
//     if (newPassword !== cnewPassword) {
//         return res.status(400).json({ message: 'New password and confirmation password do not match' });
//     }

//     try {
//         // Find the user by email
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Compare old password with stored hash
//         const isMatch = await bcrypt.compare(oldPassword, user.password);
//         if (!isMatch) {
//             return res.status(401).json({ message: 'Incorrect old password' });
//         }

//         // Check if the new password is the same as the old password
//         const isSamePassword = await bcrypt.compare(newPassword, user.password);
//         if (isSamePassword) {
//             return res.status(400).json({ message: 'New password cannot be the same as the old password' });
//         }

//         // Hash the new password
//         const hashedPassword = await bcrypt.hash(newPassword, 10);

//         // Update the password in the database
//         user.password = hashedPassword;
//         await user.save();

//         res.status(200).json({ message: 'Password updated successfully' });
//     } catch (error) {
//         res.status(500).json({ message: 'Server error', error });
//     }
// };
