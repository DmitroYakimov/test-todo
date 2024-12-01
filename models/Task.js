const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: String,
    description: String,
    priority: Number,
    status: { type: String, default: 'todo' },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date,
    subtasks: [this] 
});

module.exports = mongoose.model('Task', TaskSchema);