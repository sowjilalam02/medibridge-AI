"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Find hospital admin profile / associated hospital
// For simplicity in the demo, we assume the admin controls the first hospital or can link themselves.
// We can find the hospital by name or assign one.
async function getAdminHospital(userId) {
    // In a multi-tenant system, we would match hospitalId to the user. 
    // For the hackathon, we fetch the first hospital or create a default one if none exists.
    let hospital = await models_1.Hospital.findOne({});
    if (!hospital) {
        hospital = new models_1.Hospital({
            name: "City Central Clinic",
            city: "New York",
            specialty: ["General Medicine", "Cardiology", "Pediatrics"],
            rating: 4.8,
            averageCost: 150,
            waitingTime: 15,
            availableSpecialists: ["Cardiologist", "Pediatrician"]
        });
        await hospital.save();
    }
    return hospital;
}
// Dashboard statistics
router.get('/dashboard', auth_1.auth, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const hospital = await getAdminHospital(req.user.userId);
        const doctorsCount = await models_1.Doctor.countDocuments({ hospitalId: hospital._id });
        const appointmentsCount = await models_1.Appointment.countDocuments({ hospitalId: hospital._id });
        const completedCount = await models_1.Appointment.countDocuments({ hospitalId: hospital._id, status: 'completed' });
        // Estimate revenue (completed * averageCost)
        const estimatedRevenue = completedCount * hospital.averageCost;
        // Get list of doctors
        const doctors = await models_1.Doctor.find({ hospitalId: hospital._id });
        // Recent appointments
        const recentAppointments = await models_1.Appointment.find({ hospitalId: hospital._id })
            .populate('patientId')
            .populate('doctorId')
            .sort({ createdAt: -1 })
            .limit(5);
        // Chart analytics (mock data for simplicity, but dynamic based on DB counts)
        const analytics = [
            { month: 'Jan', appointments: Math.round(appointmentsCount * 0.4) },
            { month: 'Feb', appointments: Math.round(appointmentsCount * 0.6) },
            { month: 'Mar', appointments: Math.round(appointmentsCount * 0.8) },
            { month: 'Apr', appointments: appointmentsCount }
        ];
        return res.json({
            hospital,
            stats: {
                doctorsCount,
                appointmentsCount,
                completedCount,
                estimatedRevenue
            },
            doctors,
            recentAppointments,
            analytics
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Manage Doctors: Create Doctor
router.post('/doctors', auth_1.auth, async (req, res) => {
    const { email, password, name, specialty, availability } = req.body;
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const hospital = await getAdminHospital(req.user.userId);
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists.' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = new models_1.User({ email, passwordHash, role: 'doctor' });
        await user.save();
        const doctor = new models_1.Doctor({
            name,
            specialty,
            availability: Array.isArray(availability) ? availability : [availability],
            hospitalId: hospital._id,
            userId: user._id
        });
        await doctor.save();
        return res.status(201).json({ doctor, message: 'Doctor registered successfully.' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Manage Doctors: Get All Doctors
router.get('/doctors', auth_1.auth, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const hospital = await getAdminHospital(req.user.userId);
        const doctors = await models_1.Doctor.find({ hospitalId: hospital._id });
        return res.json(doctors);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Manage Doctors: Delete Doctor
router.delete('/doctors/:id', auth_1.auth, async (req, res) => {
    try {
        const doctor = await models_1.Doctor.findById(req.params.id);
        if (!doctor)
            return res.status(404).json({ message: 'Doctor not found.' });
        // Delete associated User
        await models_1.User.findByIdAndDelete(doctor.userId);
        await models_1.Doctor.findByIdAndDelete(req.params.id);
        return res.json({ message: 'Doctor removed successfully.' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Manage Appointments: Get All
router.get('/appointments', auth_1.auth, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const hospital = await getAdminHospital(req.user.userId);
        const appointments = await models_1.Appointment.find({ hospitalId: hospital._id })
            .populate('patientId')
            .populate('doctorId')
            .sort({ date: -1 });
        return res.json(appointments);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Update Hospital Profile
router.put('/profile', auth_1.auth, async (req, res) => {
    const { name, city, specialty, averageCost, waitingTime } = req.body;
    try {
        if (!req.user)
            return res.status(401).json({ message: 'Unauthorized' });
        const hospital = await getAdminHospital(req.user.userId);
        if (name)
            hospital.name = name;
        if (city)
            hospital.city = city;
        if (specialty)
            hospital.specialty = specialty;
        if (averageCost)
            hospital.averageCost = Number(averageCost);
        if (waitingTime)
            hospital.waitingTime = Number(waitingTime);
        await hospital.save();
        return res.json({ hospital, message: 'Hospital profile updated successfully.' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.default = router;
