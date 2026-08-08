"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Overall platform statistics
router.get('/stats', auth_1.auth, (0, auth_1.requireRole)(['super_admin']), async (req, res) => {
    try {
        const totalHospitals = await models_1.Hospital.countDocuments({});
        const totalDoctors = await models_1.Doctor.countDocuments({});
        const totalPatients = await models_1.Patient.countDocuments({});
        const totalAppointments = await models_1.Appointment.countDocuments({});
        // Overall monthly data (Mock aggregate for dashboard chart)
        const monthlyStats = [
            { month: 'Jan', appointments: Math.round(totalAppointments * 0.4), hospitals: totalHospitals },
            { month: 'Feb', appointments: Math.round(totalAppointments * 0.6), hospitals: totalHospitals },
            { month: 'Mar', appointments: Math.round(totalAppointments * 0.8), hospitals: totalHospitals },
            { month: 'Apr', appointments: totalAppointments, hospitals: totalHospitals }
        ];
        return res.json({
            stats: {
                totalHospitals,
                totalDoctors,
                totalPatients,
                totalAppointments
            },
            monthlyStats
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Get all hospitals
router.get('/hospitals', auth_1.auth, (0, auth_1.requireRole)(['super_admin']), async (req, res) => {
    try {
        const hospitals = await models_1.Hospital.find({});
        return res.json(hospitals);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Add Hospital
router.post('/hospitals', auth_1.auth, (0, auth_1.requireRole)(['super_admin']), async (req, res) => {
    const { name, city, specialty, rating, averageCost, waitingTime, availableSpecialists } = req.body;
    try {
        const hospital = new models_1.Hospital({
            name,
            city,
            specialty: Array.isArray(specialty) ? specialty : [specialty],
            rating: rating ? Number(rating) : 4.0,
            averageCost: Number(averageCost),
            waitingTime: Number(waitingTime),
            availableSpecialists: Array.isArray(availableSpecialists) ? availableSpecialists : [availableSpecialists]
        });
        await hospital.save();
        return res.status(201).json({ hospital, message: 'Hospital added successfully.' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Delete Hospital
router.delete('/hospitals/:id', auth_1.auth, (0, auth_1.requireRole)(['super_admin']), async (req, res) => {
    try {
        const hospital = await models_1.Hospital.findByIdAndDelete(req.params.id);
        if (!hospital)
            return res.status(404).json({ message: 'Hospital not found.' });
        // Also remove doctors associated with it
        await models_1.Doctor.deleteMany({ hospitalId: req.params.id });
        return res.json({ message: 'Hospital and associated doctor profiles deleted successfully.' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.default = router;
