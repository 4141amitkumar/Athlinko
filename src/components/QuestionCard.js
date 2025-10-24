import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './QuestionCard.css';

const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const seconds = Math.floor((now - timestamp.toDate()) / 1000);
  
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

const QuestionCard = ({ question, currentUser }) => {
  const [newAnswer, setNewAnswer] = useState('');
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const isCoach = currentUser.role === 'coach';

  const handlePostAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim() || !isCoach) return;

    const questionRef = doc(db, 'qna', question.id);

    try {
      await updateDoc(questionRef, {
        answers: arrayUnion({
          answerText: newAnswer,
          expert: {
            id: currentUser.sub,
            name: currentUser.name,
            picture: currentUser.picture,
            role: currentUser.role,
          },
          timestamp: serverTimestamp(),
        })
      });
      setNewAnswer('');
      setShowAnswerInput(false);
    } catch (error) {
      console.error("Error posting answer: ", error);
    }
  };

  return (
    <div className="question-card">
      <div className="question-section">
        <div className="asker-info">
          <Link to={`/profile/${question.asker.id}`}>
            <img src={question.asker.picture} alt={question.asker.name} />
          </Link>
          <div>
            <Link to={`/profile/${question.asker.id}`} className="asker-name">{question.asker.name}</Link>
            <span className="question-timestamp">{formatTimeAgo(question.timestamp)}</span>
          </div>
        </div>
        <p className="question-text">{question.questionText}</p>
      </div>

      <div className="answers-section">
        {question.answers && question.answers.length > 0 ? (
          question.answers.map((answer, index) => (
            <div key={index} className="answer">
              <div className="asker-info">
                <Link to={`/profile/${answer.expert.id}`}>
                  <img src={answer.expert.picture} alt={answer.expert.name} />
                </Link>
                <div>
                  <Link to={`/profile/${answer.expert.id}`} className="asker-name">{answer.expert.name}</Link>
                  <span className="question-timestamp">{formatTimeAgo(answer.timestamp)}</span>
                </div>
              </div>
              <p className="answer-text">{answer.answerText}</p>
            </div>
          ))
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
              />
              <div className="answer-form-actions">
                <button type="button" onClick={() => setShowAnswerInput(false)} className="cancel-btn">Cancel</button>
                <button type="submit" disabled={!newAnswer.trim()} className="submit-answer-btn">Post Answer</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
