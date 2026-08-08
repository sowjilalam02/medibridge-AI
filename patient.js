"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const recommendationEngine_1 = require("../utils/recommendationEngine");
const router = (0, express_1.Router)();
// Patient dashboard summary
router.get('/dashboard', auth_1.auth, async (req, res) => {
    try {
        const patient = await models_1.Patient.findOne({ userId: req.user?.userId });
        if (!patient)
            return res.status(404).json({ message: 'Patient profile not found.' });
        const totalAppointments = await models_1.Appointment.countDocuments({ patientId: patient._id });
        const upcomingAppointments = await models_1.Appointment.find({ patientId: patient._id, status: 'booked' })
            .populate('hospitalId')
            .populate('doctorId')
            .sort({ date: 1 })
            .limit(3);
        const records = await models_1.MedicalRecord.find({ patientId: patient._id })
            .populate('doctorId')
            .sort({ createdAt: -1 })
            .limit(5);
        return res.json({
            patient,
            totalAppointments,
            upcomingAppointments,
            records
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// AI Hospital Recommendation Engine
router.post('/recommend', auth_1.auth, async (req, res) => {
    const { age, gender, symptoms, preferredLocation, budget } = req.body;
    try {
        const recommendations = await (0, recommendationEngine_1.getRecommendations)({
            age: Number(age),
            gender,
            symptoms,
            preferredLocation,
            budget: Number(budget)
        });
        return res.json(recommendations);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Search Hospitals
router.get('/hospitals', auth_1.auth, async (req, res) => {
    const { city, specialty, minRating, maxCost } = req.query;
    try {
        const query = {};
        if (city)
            query.city = { $regex: new RegExp(city, 'i') };
        if (specialty)
            query.specialty = { $regex: new RegExp(specialty, 'i') };
        if (minRating)
            query.rating = { $gte: Number(minRating) };
        if (maxCost)
            query.averageCost = { $lte: Number(maxCost) };
        const hospitals = await models_1.Hospital.find(query);
        return res.json(hospitals);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Search Doctors
router.get('/doctors', auth_1.auth, async (req, res) => {
    const { specialty, hospitalId } = req.query;
    try {
        const query = {};
        if (specialty)
            query.specialty = { $regex: new RegExp(specialty, 'i') };
        if (hospitalId)
            query.hospitalId = hospitalId;
        const doctors = await models_1.Doctor.find(query).populate('hospitalId');
        return res.json(doctors);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Book Appointment
router.post('/book-appointment', auth_1.auth, async (req, res) => {
    const { hospitalId, doctorId, date, slot } = req.body;
    try {
        const patient = await models_1.Patient.findOne({ userId: req.user?.userId });
        if (!patient)
            return res.status(404).json({ message: 'Patient profile not found.' });
        // Check if slot is already booked for this doctor on this date
        const existing = await models_1.Appointment.findOne({ doctorId, date, slot, status: 'booked' });
        if (existing) {
            return res.status(400).json({ message: 'This time slot is already booked.' });
        }
        const appointment = new models_1.Appointment({
            patientId: patient._id,
            hospitalId,
            doctorId,
            date,
            slot,
            status: 'booked'
        });
        await appointment.save();
        return res.status(201).json({ appointment, message: 'Appointment booked successfully!' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// View Appointments
router.get('/appointments', auth_1.auth, async (req, res) => {
    try {
        const patient = await models_1.Patient.findOne({ userId: req.user?.userId });
        if (!patient)
            return res.status(404).json({ message: 'Patient profile not found.' });
        const appointments = await models_1.Appointment.find({ patientId: patient._id })
            .populate('hospitalId')
            .populate('doctorId')
            .sort({ date: -1 });
        return res.json(appointments);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// View Medical Records
router.get('/records', auth_1.auth, async (req, res) => {
    try {
        const patient = await models_1.Patient.findOne({ userId: req.user?.userId });
        if (!patient)
            return res.status(404).json({ message: 'Patient profile not found.' });
        const records = await models_1.MedicalRecord.find({ patientId: patient._id })
            .populate('doctorId')
            .populate({
            path: 'doctorId',
            populate: { path: 'hospitalId' }
        })
            .sort({ date: -1 });
        return res.json(records);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Update Profile
router.put('/profile', auth_1.auth, async (req, res) => {
    const { name, age, gender, medicalHistory } = req.body;
    try {
        const patient = await models_1.Patient.findOne({ userId: req.user?.userId });
        if (!patient)
            return res.status(404).json({ message: 'Patient profile not found.' });
        if (name)
            patient.name = name;
        if (age)
            patient.age = Number(age);
        if (gender)
            patient.gender = gender;
        if (medicalHistory)
            patient.medicalHistory = medicalHistory;
        await patient.save();
        return res.json({ patient, message: 'Profile updated successfully.' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.default = router;
