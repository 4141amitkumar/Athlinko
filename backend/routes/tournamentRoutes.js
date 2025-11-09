// routes/tournamentRoutes.js

const express = require('express');
const router = express.Router();
const { db } = require('../db'); 
const { FieldValue } = require('firebase-admin/firestore');
const authMiddleware = require('../middleware/authMiddleware'); 
// GET: Saare active tournaments fetch karna
router.get('/active', async (req, res) => {
    try {
        const snapshot = await db.collection('tournaments').where('status', '==', 'active').get();
        if (snapshot.empty) {
            return res.status(200).json([]);
        }
        const tournaments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(tournaments);
    } catch (error) {
        console.error("Error fetching active tournaments: ", error);
        res.status(500).send('Server error');
    }
});

// GET: Saare past tournaments fetch karna
router.get('/past', async (req, res) => {
    try {
        const snapshot = await db.collection('tournaments').where('status', '==', 'past').get();
        if (snapshot.empty) {
            return res.status(200).json([]);
        }
        const tournaments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(tournaments);
    } catch (error) {
        console.error("Error fetching past tournaments: ", error);
        res.status(500).send('Server error');
    }
});

// GET: User ke participated tournaments fetch karna (Protected Route)
router.get('/participated', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid; // authMiddleware se user ki ID milegi
        const snapshot = await db.collection('tournaments').where('participants', 'array-contains', userId).get();
        if (snapshot.empty) {
            return res.status(200).json([]);
        }
        const tournaments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).json(tournaments);
    } catch (error) {
        console.error("Error fetching participated tournaments: ", error);
        res.status(500).send('Server error');
    }
});

// POST: Tournament ke liye register karna (Protected Route)
router.post('/:id/register', authMiddleware, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const userId = req.user.uid;
        
        const tournamentRef = db.collection('tournaments').doc(tournamentId);
        await tournamentRef.update({
            participants: FieldValue.arrayUnion(userId) // arrayUnion duplicate entry nahi hone dega
        });

        res.status(200).json({ message: 'Successfully registered for the tournament!' });
    } catch (error) {
        console.error("Error registering for tournament: ", error);
        res.status(500).send('Server error');
    }
});


module.exports = router;