import mongoose from 'mongoose';
const hrInternSchema = new mongoose.Schema({
    hrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
      unique: true, // Ensures one document per HR
    },
    internIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
      },
    ],
  });
  
  // Validation to ensure no more than 20 interns are added
  
  
  export default mongoose.model('HRIntern', hrInternSchema);
  