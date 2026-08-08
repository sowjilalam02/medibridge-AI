"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Doctor dashboard
router.get('/dashboard', auth_1.auth, async (req, res) => {
    try {
        const doctor = await models_1.Doctor.findOne({ userId: req.user?.userId });
        if (!doctor)
            return res.status(404).json({ message: 'Doctor profile not found.' });
        // Get today's date in YYYY-MM-DD format
        const todayStr = new Date().toISOString().split('T')[0];
        const todayAppointments = await models_1.Appointment.find({ doctorId: doctor._id, date: todayStr })
            .populate('patientId')
            .sort({ slot: 1 });
        const totalAppointments = await models_1.Appointment.countDocuments({ doctorId: doctor._id });
        const pendingAppointments = await models_1.Appointment.countDocuments({ doctorId: doctor._id, status: 'booked' });
        const completedAppointments = await models_1.Appointment.countDocuments({ doctorId: doctor._id, status: 'completed' });
        return res.json({
            doctor,
            todayAppointments,
            stats: {
                totalAppointments,
                pendingAppointments,
                completedAppointments
            }
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// View all appointments for the doctor
router.get('/appointments', auth_1.auth, async (req, res) => {
    try {
        const doctor = await models_1.Doctor.findOne({ userId: req.user?.userId });
        if (!doctor)
            return res.status(404).json({ message: 'Doctor profile not found.' });
        const appointments = await models_1.Appointment.find({ doctorId: doctor._id })
            .populate('patientId')
            .sort({ date: -1, slot: 1 });
        return res.json(appointments);
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// View patient history/records
router.get('/patient-history/:patientId', auth_1.auth, async (req, res) => {
    try {
        const records = await models_1.MedicalRecord.find({ patientId: req.params.patientId })
            .populate('doctorId')
            .sort({ date: -1 });
        const patient = await models_1.Patient.findById(req.params.patientId);
        return res.json({
            patient,
            records
        });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Add Medical Record / Prescription
router.post('/prescription', auth_1.auth, async (req, res) => {
    const { patientId, appointmentId, diagnosis, prescriptions, reports } = req.body;
    try {
        const doctor = await models_1.Doctor.findOne({ userId: req.user?.userId });
        if (!doctor)
            return res.status(404).json({ message: 'Doctor profile not found.' });
        const todayStr = new Date().toISOString().split('T')[0];
        const record = new models_1.MedicalRecord({
            patientId,
            doctorId: doctor._id,
            diagnosis,
            prescriptions: Array.isArray(prescriptions) ? prescriptions : [prescriptions],
            reports: Array.isArray(reports) ? reports : [reports],
            date: todayStr
        });
        await record.save();
        // Mark appointment as completed if appointmentId is provided
        if (appointmentId) {
            await models_1.Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' });
        }
        return res.status(201).json({ record, message: 'Prescription/Medical Record added successfully.' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
// Complete Appointment
router.post('/complete-appointment/:id', auth_1.auth, async (req, res) => {
    try {
        const appointment = await models_1.Appointment.findByIdAndUpdate(req.params.id, { status: 'completed' }, { new: true });
        return res.json({ appointment, message: 'Appointment marked completed.' });
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }
});
exports.default = router;
