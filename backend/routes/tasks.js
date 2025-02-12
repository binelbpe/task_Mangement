const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');


router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, search, sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 9 } = req.query;
    
  
    const query = req.user.role === 'admin' ? {} : { user: req.user.userId };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Task.countDocuments(query);

    const tasks = await Task.find(query)
      .sort(sort)
      .populate('user', 'name email')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      tasks,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/', auth, async (req, res) => {
  try {
    const { title, description, dueDate, priority } = req.body;
    
    const task = new Task({
      title,
      description,
      dueDate,
      priority,
      user: req.user.userId
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, dueDate, priority, status } = req.body;
    const query = req.user.role === 'admin' 
      ? { _id: req.params.id }
      : { _id: req.params.id, user: req.user.userId };

    const task = await Task.findOneAndUpdate(
      query,
      { title, description, dueDate, priority, status },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/:id', auth, async (req, res) => {
  try {
    const query = req.user.role === 'admin' 
      ? { _id: req.params.id }
      : { _id: req.params.id, user: req.user.userId };

    const task = await Task.findOneAndDelete(query);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 