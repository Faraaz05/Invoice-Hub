const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'clerk', 'manager', 'controller'],
      message: 'Role must be either admin, clerk, manager, or controller'
    },
    required: [true, 'Role is required'],
    default: 'clerk'
  },
  department: {
    type: String,
    enum: {
      values: ['Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'IT', 'Procurement', 'Legal'],
      message: 'Department must be one of: Sales, Marketing, Operations, Finance, HR, IT, Procurement, Legal'
    },
    required: function() {
      return this.role === 'manager';
    },
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);