import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Kisi bhi user ko ek notification bhejta hai.
 * @param {string} userId - Jis user ko notification bhejna hai (recipient).
 * @param {string} text - Notification ka message.
 * @param {string} link - Notification par click karke kahan jaana hai (e.g., /profile/123).
 */
export const createNotification = async (userId, text, link) => {
    if (!userId || !text || !link) {
        console.error("Notification missing required fields:", { userId, text, link });
        return;
    }
    
    try {
        const notificationsColRef = collection(db, 'users', userId, 'notifications');
        await addDoc(notificationsColRef, {
            text,
            link,
            isRead: false,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating notification: ", error);
    }
};