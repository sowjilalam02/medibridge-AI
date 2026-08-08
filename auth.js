"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'medibridge_secret_key_12345';
// Register Patient
router.post('/register/patient', async (req, res) => {
    const { email, password, name, age, gender } = req.body;
    try {
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered.' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = new models_1.User({ email, passwordHash, role: 'patient' });
        await user.save();
        const patient = new models_1.Patient({
            name,
            age,
            gender,
            userId: user._id,
            medicalHistory: []
        });
        await patient.save();
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        return res.status(201).json({ token, user: { email: user.email, role: user.role, name: patient.name } });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Login User
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await models_1.User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }
        let name = 'User';
        if (user.role === 'patient') {
            const patient = await models_1.Patient.findOne({ userId: user._id });
            if (patient)
                name = patient.name;
        }
        else if (user.role === 'doctor') {
            const doctor = await models_1.Doctor.findOne({ userId: user._id });
            if (doctor)
                name = doctor.name;
        }
        else {
            name = user.role.replace('_', ' ').toUpperCase();
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ token, user: { id: user._id, email: user.email, role: user.role, name } });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Get Profile Info
router.get('/me', auth_1.auth, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const user = await models_1.User.findById(req.user.userId);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        let profileData = {};
        if (user.role === 'patient') {
            profileData = await models_1.Patient.findOne({ userId: user._id });
        }
        else if (user.role === 'doctor') {
            profileData = await models_1.Doctor.findOne({ userId: user._id }).populate('hospitalId');
        }
        return res.json({
            email: user.email,
            role: user.role,
            profile: profileData
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.default = router;
