"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapSymptomsToSpecialty = mapSymptomsToSpecialty;
exports.getRecommendations = getRecommendations;
const models_1 = require("../models");
// Helper to map symptoms to specialization
function mapSymptomsToSpecialty(symptoms) {
    const s = symptoms.toLowerCase();
    if (s.includes('heart') || s.includes('chest pain') || s.includes('cardio') || s.includes('palpitations')) {
        return 'Cardiology';
    }
    if (s.includes('bone') || s.includes('joint') || s.includes('fracture') || s.includes('back pain') || s.includes('ortho')) {
        return 'Orthopedics';
    }
    if (s.includes('skin') || s.includes('rash') || s.includes('acne') || s.includes('itch') || s.includes('derma')) {
        return 'Dermatology';
    }
    if (s.includes('brain') || s.includes('headache') || s.includes('dizzy') || s.includes('seizure') || s.includes('neuro')) {
        return 'Neurology';
    }
    if (s.includes('child') || s.includes('pediatric') || s.includes('baby') || s.includes('kid')) {
        return 'Pediatrics';
    }
    if (s.includes('eye') || s.includes('vision') || s.includes('opthalmology')) {
        return 'Ophthalmology';
    }
    // Default to General Medicine
    return 'General Medicine';
}
async function getRecommendations(input) {
    const requiredSpecialty = mapSymptomsToSpecialty(input.symptoms);
    // Find hospitals in the city
    // If no hospitals are found in the city, find all hospitals as fallback
    let hospitals = await models_1.Hospital.find({ city: { $regex: new RegExp(input.preferredLocation, 'i') } });
    if (hospitals.length === 0) {
        hospitals = await models_1.Hospital.find({});
    }
    const recommendations = [];
    for (const hospital of hospitals) {
        // Check if the hospital supports this specialty
        const supportsSpecialty = hospital.specialty.some(s => s.toLowerCase() === requiredSpecialty.toLowerCase());
        // Find best doctor in this hospital for the specialty
        const doctors = await models_1.Doctor.find({ hospitalId: hospital._id, specialty: { $regex: new RegExp(requiredSpecialty, 'i') } });
        let score = 50; // base score
        if (supportsSpecialty) {
            score += 30; // specialty match bonus
        }
        // Rating contribution (max 50 points: rating * 10)
        score += (hospital.rating || 4.0) * 10;
        // Budget check
        if (hospital.averageCost <= input.budget) {
            score += 20; // within budget bonus
        }
        else {
            // Cost penalty: deduct points proportional to how much it exceeds budget
            const difference = hospital.averageCost - input.budget;
            score -= Math.min(30, Math.floor(difference / 100));
        }
        // Waiting time penalty: deduct points for long wait (e.g. -1 point per 5 minutes)
        score -= Math.floor(hospital.waitingTime / 5);
        // Doctor availability bonus
        if (doctors.length > 0) {
            score += 15;
        }
        // Compose a friendly reason
        const reasons = [];
        if (supportsSpecialty) {
            reasons.push(`Specializes in ${requiredSpecialty}`);
        }
        else {
            reasons.push(`Offers general services matching your request`);
        }
        if (hospital.averageCost <= input.budget) {
            reasons.push(`Highly affordable within your budget of $${input.budget}`);
        }
        else {
            reasons.push(`Slightly above budget, but offers premium care`);
        }
        reasons.push(`Has a high rating of ${hospital.rating}/5`);
        if (hospital.waitingTime < 30) {
            reasons.push(`Short waiting time of only ${hospital.waitingTime} minutes`);
        }
        recommendations.push({
            hospital,
            doctor: doctors.length > 0 ? doctors[0] : null,
            priorityScore: Math.max(10, score), // floor at 10
            reason: reasons.join(', ') + '.'
        });
    }
    // Sort by highest priority score
    return recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
}
