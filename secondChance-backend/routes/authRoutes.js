const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const router = express.Router();

const connectToDatabase = require('../models/db');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET;


// ==================== REGISTER ====================

router.post('/register', async (req, res) => {
    try {
        // Task 1: Connect to database
        const db = await connectToDatabase();

        // Task 2: Access users collection
        const collection = db.collection("users");

        // Task 3: Check if email already exists
        const existingEmail = await collection.findOne({
            email: req.body.email
        });

        if (existingEmail) {
            logger.error('Email id already exists');
            return res.status(400).json({
                error: 'Email id already exists'
            });
        }

        // Task 4: Hash password
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);

        // Task 5: Insert user
        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date(),
        });

        // Task 6: Create JWT
        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);

        // Task 7: Log successful registration
        logger.info('User registered successfully');

        // Task 8: Return email and token
        const email = req.body.email;

        res.json({
            authtoken,
            email
        });

    } catch (e) {
        return res.status(500).send('Internal server error');
    }
});


// ==================== UPDATE ====================

router.put('/update', async (req, res) => {
    try {
        // Task 1: Validate input
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            logger.error(
                'Validation errors in update request',
                errors.array()
            );

            return res.status(400).json({
                errors: errors.array()
            });
        }

        // Task 2: Check if email is present in the header
        const email = req.headers.email;

        if (!email) {
            logger.error('Email not found in the request headers');

            return res.status(400).json({
                error: "Email not found in the request headers"
            });
        }

        // Task 3: Connect to MongoDB
        const db = await connectToDatabase();

        // Access users collection
        const collection = db.collection("users");

        // Task 4: Find the user credentials
        const existingUser = await collection.findOne({
            email
        });

        if (!existingUser) {
            logger.error('User not found');

            return res.status(404).json({
                error: "User not found"
            });
        }

        // Update fields
        existingUser.firstName = req.body.firstName;
        existingUser.lastName = req.body.lastName;
        existingUser.updatedAt = new Date();

        // Task 5: Update user credentials
        const updatedUser = await collection.findOneAndUpdate(
            { email },
            { $set: existingUser },
            { returnDocument: 'after' }
        );

        // Task 6: Create JWT authentication
        const payload = {
            user: {
                id: updatedUser._id.toString(),
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);

        res.json({
            authtoken
        });

    } catch (e) {
        return res.status(500).send('Internal server error');
    }
});


module.exports = router;