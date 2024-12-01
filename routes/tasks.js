const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
  const { status, priorityMin, priorityMax, title, sortBy, order } = req.query;

  let query = {};
  if (status) query.status = status;
  if (priorityMin || priorityMax) {
    query.priority = {
      ...(priorityMin && { $gte: Number(priorityMin) }),
      ...(priorityMax && { $lte: Number(priorityMax) })
    };
  }
  if (title) query.title = new RegExp(title, 'i');

  const sort = {};
  if (sortBy) sort[sortBy] = order === 'desc' ? -1 : 1;

  try {
    const tasks = await Task.find(query).sort(sort);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

router.post('/', async (req, res) => {
  const { title, description, priority, subtasks } = req.body;

  try {
    const newTask = new Task({ title, description, priority, subtasks });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (error) {
    res.status(400).json({ error: 'Error creating task' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.status === 'done') {
      return res.status(400).json({ error: 'Cannot edit a completed task' });
    }

    Object.assign(task, updates);
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: 'Error updating task' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.status === 'done') {
      return res.status(400).json({ error: 'Cannot delete a completed task' });
    }

    await task.deleteOne();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting task' });
  }
});

router.patch('/:id/complete', async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id).populate('subtasks');
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const hasIncompleteSubtasks = task.subtasks.some(subtask => subtask.status !== 'done');
    if (hasIncompleteSubtasks) {
      return res.status(400).json({ error: 'Cannot complete a task with incomplete subtasks' });
    }

    task.status = 'done';
    task.completedAt = new Date();
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Error completing task' });
  }
});

router.post('/:taskId/subtasks', async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, description, priority } = req.body;

        const parentTask = await Task.findById(taskId);
        if (!parentTask) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const subtask = {
            _id: new mongoose.Types.ObjectId(),
            title,
            description,
            priority,
            status: 'todo',
            createdAt: new Date(),
            subtasks: [],
        };

        parentTask.subtasks.push(subtask);
        await parentTask.save();

        res.status(201).json(subtask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;