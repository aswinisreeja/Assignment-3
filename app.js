const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { sequelize, User, Task } = require('./models');
const authenticateToken = require('./middleware/authenticateToken');
const TaskUpdate=require('./middleware/validatemiddleware');

const app = express();
const port = 3000;
const SECRET_KEY = 'my_super_secret_key';

app.use(bodyParser.json());


app.post('/tasks/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        await User.create({ email, password_hash: passwordHash });

        res.status(201).json({ message: 'User registered' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});


app.post('/tasks/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

app.post('/tasks', authenticateToken,TaskUpdate(),async (req, res) => {
    const { title, description } = req.body;
    const { id: userId } = req.user;

    try {
        const task = await Task.create({ title, description, userId });
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});


app.get('/tasks', authenticateToken,TaskUpdate(), async (req, res) => {
    try {
        const tasks = await Task.findAll({ where: { userId: req.user.id } });
        res.status(200).json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});


app.get('/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const task = await Task.findOne({ where: { id, userId: req.user.id } });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

app.put('/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body;

    try {
        const task = await Task.findOne({ where: { id, userId: req.user.id } });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.title = title || task.title;
        task.description = description || task.description;
        task.status = status || task.status;

        await task.save();
        res.status(200).json({ message: 'Task updated successfully', task });
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

app.delete('/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const task = await Task.findOne({ where: { id, userId: req.user.id } });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await task.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

app.post('/tasks/email/:id', authenticateToken, async (req, res) => {
    const { id } = req.user;

    try {
        const user = await User.findByPk(id);
        const tasks = await Task.findAll({ where: { userId: id } });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'nodemailerforlearningg@gmail.com',
                pass: 'yleqxrbnakukerte'
            }
        });

        const mailOptions = {
            from: 'nodemailerforlearningg@gmail.com',
            to: user.email,
            subject: 'Task Summary',
            text: `Here is your task summary:\n\n${tasks.map(task => `${task.title}: ${task.description}\n`).join('')}`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Task summary sent' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});


sequelize.sync().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}).catch(error => {
    console.error('Error syncing with the database:', error);
});
