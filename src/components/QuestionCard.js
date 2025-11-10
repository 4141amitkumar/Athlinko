import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { createNotification } from '../utils/notifications'; // Notification helper import
import './QuestionCard.css';

const formatTimeAgo = (timestamp) => {
    // Check if timestamp is valid and has toDate method
    if (!timestamp?.toDate) return 'A while ago';
    try {
        const now = new Date();
        const date = timestamp.toDate(); // Convert Firestore Timestamp to JS Date
        const seconds = Math.floor((now - date) / 1000);

        let interval = seconds / 31536000; // years
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " year ago" : " years ago");
        interval = seconds / 2592000; // months
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " month ago" : " months ago");
        interval = seconds / 86400; // days
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " day ago" : " days ago");
        interval = seconds / 3600; // hours
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " hour ago" : " hours ago");
        interval = seconds / 60; // minutes
        if (interval > 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " minute ago" : " minutes ago");
        if (seconds < 10) return "Just now";
        return Math.floor(seconds) + " seconds ago";
    } catch (e) {
        console.error("Error formatting timestamp:", e);
        return 'Invalid date'; // Handle potential errors during date conversion
    }
};


const QuestionCard = ({ question, currentUser }) => {
  const [newAnswer, setNewAnswer] = useState('');
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submitting state

   // Add check for currentUser and currentUser.uid
  const isCoach = currentUser?.role === 'coach' && currentUser?.uid;

  const handlePostAnswer = async (e) => {
    e.preventDefault();
    // Add check for currentUser and currentUser.uid
    if (!newAnswer.trim() || !isCoach || !currentUser?.uid) return;

    setIsSubmitting(true); // Start submitting
    const questionRef = doc(db, 'qna', question.id);

    try {
      await updateDoc(questionRef, {
        answers: arrayUnion({
          answerText: newAnswer,
          expert: {
            id: currentUser.uid, // Use uid
            name: currentUser.name, // Ensure 'name' is correct
            picture: currentUser.picture, // Ensure 'picture' is correct
            role: currentUser.role, // Ensure 'role' is correct
          },
          timestamp: serverTimestamp(),
        })
      });
      
      // ** NOTIFICATION TRIGGER **
      const askerId = question.asker?.id;
      // Agar asker valid hai aur coach khud ke sawaal ka jawaab nahi de raha
      if (askerId && askerId !== currentUser.uid) {
        createNotification(
            askerId,
            `${currentUser.name} answered your question.`,
            `/qna` // Link to QnA page
        );
      }

      setNewAnswer(''); // Clear on success
      setShowAnswerInput(false); // Hide form on success
    } catch (error) {
      console.error("Error posting answer: ", error);
      alert("Failed to post answer. Please try again.");
    } finally {
      setIsSubmitting(false); // Stop submitting
    }
  };

  // Safe access to asker properties
  const askerId = question.asker?.id;
  const askerPicture = question.asker?.picture || 'https://via.placeholder.com/40';
  const askerName = question.asker?.name || 'Unknown User';


  return (
    <div className="question-card">
      <div className="question-section">
        <div className="asker-info">
           {/* Link only if askerId exists */}
          <Link to={askerId ? `/profile/${askerId}` : '#'}>
            <img
                src={askerPicture}
                alt={askerName}
                onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/40"; }}
             />
          </Link>
          <div>
             {/* Link only if askerId exists */}
            <Link to={askerId ? `/profile/${askerId}` : '#'} className="asker-name">{askerName}</Link>
            <span className="question-timestamp">{formatTimeAgo(question.timestamp)}</span>
          </div>
        </div>
        <p className="question-text">{question.questionText}</p>
      </div>

      <div className="answers-section">
        {/* Sort answers by timestamp, newest first (optional, reverses the display order) */}
        {question.answers && question.answers.length > 0 ? (
          [...question.answers].sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate()).map((answer, index) => {
             // Safe access to expert properties
            const expertId = answer.expert?.id;
            const expertPicture = answer.expert?.picture || 'https://via.placeholder.com/40';
            const expertName = answer.expert?.name || 'Expert';

            return (
                <div key={index} className="answer">
                  <div className="asker-info">
                    {/* Link only if expertId exists */}
                    <Link to={expertId ? `/profile/${expertId}` : '#'}>
                      <img
                        src={expertPicture}
                        alt={expertName}
                        onError={(e) => { e.target.onerror = null; e.target.src="https://via.placeholder.com/40"; }}
                       />
                    </Link>
                    <div>
                       {/* Link only if expertId exists */}
                      <Link to={expertId ? `/profile/${expertId}` : '#'} className="asker-name">{expertName}</Link>
                      <span className="question-timestamp">{formatTimeAgo(answer.timestamp)}</span>
                    </div>
                  </div>
                  <p className="answer-text">{answer.answerText}</p>
                </div>
            );
          })
        ) : (
          <p className="no-answers">No answers yet.</p>
        )}
      </div>

      {isCoach && (
        <div className="answer-form-container">
          {!showAnswerInput ? (
            <button onClick={() => setShowAnswerInput(true)} className="answer-prompt-btn">Answer this question</button>
          ) : (
            <form onSubmit={handlePostAnswer} className="answer-form">
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Share your expertise..."
                rows="3"
                disabled={isSubmitting} // Disable while submitting
              />
              <div className="answer-form-actions">
                <button type="button" onClick={() => setShowAnswerInput(false)} className="cancel-btn" disabled={isSubmitting}>Cancel</button>
                <button type="submit" disabled={!newAnswer.trim() || isSubmitting} className="submit-answer-btn">
                    {isSubmitting ? 'Posting...' : 'Post Answer'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;