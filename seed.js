"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const models_1 = require("../models");
async function seedDatabase() {
    try {
        // Check if database already has users. If yes, skip seeding.
        const userCount = await models_1.User.countDocuments({});
        if (userCount > 0) {
            console.log('Database already has data. Skipping seeding.');
            return;
        }
        console.log('Seeding database...');
        // 1. Create Default Users
        const passwordHash = await bcryptjs_1.default.hash('password', 10);
        const superAdminUser = new models_1.User({
            email: 'superadmin@medibridge.com',
            passwordHash,
            role: 'super_admin'
        });
        await superAdminUser.save();
        const hospitalAdminUser = new models_1.User({
            email: 'admin@medibridge.com',
            passwordHash,
            role: 'hospital_admin'
        });
        await hospitalAdminUser.save();
        const doctorUser = new models_1.User({
            email: 'doctor@medibridge.com',
            passwordHash,
            role: 'doctor'
        });
        await doctorUser.save();
        const patientUser = new models_1.User({
            email: 'patient@medibridge.com',
            passwordHash,
            role: 'patient'
        });
        await patientUser.save();
        // 2. Create Hospitals
        const hospital1 = new models_1.Hospital({
            name: 'Mercy General Hospital',
            city: 'New York',
            specialty: ['General Medicine', 'Cardiology', 'Pediatrics'],
            rating: 4.8,
            averageCost: 200,
            waitingTime: 15,
            availableSpecialists: ['Cardiologist', 'Pediatrician', 'General Practitioner']
        });
        await hospital1.save();
        const hospital2 = new models_1.Hospital({
            name: 'St. Jude Health Center',
            city: 'New York',
            specialty: ['General Medicine', 'Orthopedics', 'Neurology'],
            rating: 4.5,
            averageCost: 120,
            waitingTime: 25,
            availableSpecialists: ['Orthopedician', 'Neurologist', 'General Practitioner']
        });
        await hospital2.save();
        const hospital3 = new models_1.Hospital({
            name: 'Oakridge Pediatric & Family Clinic',
            city: 'Boston',
            specialty: ['Pediatrics', 'Dermatology', 'General Medicine'],
            rating: 4.6,
            averageCost: 80,
            waitingTime: 10,
            availableSpecialists: ['Pediatrician', 'Dermatologist', 'General Practitioner']
        });
        await hospital3.save();
        // 3. Create Doctor Profiles
        const doctorProfile = new models_1.Doctor({
            name: 'Dr. Elizabeth Blackwell',
            specialty: 'Cardiology',
            availability: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            timeSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
            hospitalId: hospital1._id,
            userId: doctorUser._id
        });
        await doctorProfile.save();
        // Create an extra doctor for the other hospital
        const doctorUser2 = new models_1.User({
            email: 'doctor2@medibridge.com',
            passwordHash,
            role: 'doctor'
        });
        await doctorUser2.save();
        const doctorProfile2 = new models_1.Doctor({
            name: 'Dr. Gregory House',
            specialty: 'Neurology',
            availability: ['Monday', 'Wednesday', 'Friday'],
            timeSlots: ['10:00 AM', '01:00 PM', '03:00 PM'],
            hospitalId: hospital2._id,
            userId: doctorUser2._id
        });
        await doctorProfile2.save();
        // 4. Create Patient Profile
        const patientProfile = new models_1.Patient({
            name: 'John Doe',
            age: 35,
            gender: 'Male',
            medicalHistory: ['Hypertension', 'Seasonal Allergies'],
            userId: patientUser._id
        });
        await patientProfile.save();
        // 5. Create some initial appointments
        const appointment1 = new models_1.Appointment({
            patientId: patientProfile._id,
            hospitalId: hospital1._id,
            doctorId: doctorProfile._id,
            date: new Date().toISOString().split('T')[0],
            slot: '10:00 AM',
            status: 'booked'
        });
        await appointment1.save();
        const appointment2 = new models_1.Appointment({
            patientId: patientProfile._id,
            hospitalId: hospital2._id,
            doctorId: doctorProfile2._id,
            date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], // 2 days ago
            slot: '03:00 PM',
            status: 'completed'
        });
        await appointment2.save();
        // 6. Create some initial medical records
        const record = new models_1.MedicalRecord({
            patientId: patientProfile._id,
            doctorId: doctorProfile2._id,
            diagnosis: 'Migraine Headache',
            prescriptions: ['Sumatriptan 50mg', 'Rest for 2 days'],
            reports: ['MRI Brain scan: Normal'],
            date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]
        });
        await record.save();
        console.log('Seeding completed successfully!');
    }
    catch (error) {
        console.error('Error seeding database:', error);
    }
}
