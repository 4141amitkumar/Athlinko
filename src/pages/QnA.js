import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import QuestionCard from '../components/QuestionCard';
import './QnA.css';

const QnA = ({ currentUser }) => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'qna'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuestions(questionsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    try {
      await addDoc(collection(db, 'qna'), {
        questionText: newQuestion,
        asker: {
          id: currentUser.sub,
          name: currentUser.name,
          picture: currentUser.picture,
          role: currentUser.role,
        },
        answers: [],
        timestamp: serverTimestamp(),
      });
      setNewQuestion('');
    } catch (error) {
      console.error("Error posting question: ", error);
    }
  };

  return (
    <div className="qna-page-container">
      <div className="qna-header">
        <h1>Ask an Expert</h1>
        <p>Get advice from experienced coaches and players in the community.</p>
      </div>

      <div className="ask-question-form">
        <form onSubmit={handleAskQuestion}>
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask about training, diet, career paths, etc..."
            rows="4"
          />
          <button type="submit" disabled={!newQuestion.trim()}>
            Post Your Question
          </button>
        </form>
      </div>

      <div className="questions-list">
        {loading ? (
          <p>Loading questions...</p>
        ) : questions.length > 0 ? (
          questions.map(question => (
            <QuestionCard key={question.id} question={question} currentUser={currentUser} />
          ))
        ) : (
          <p>No questions have been asked yet. Be the first!</p>
        )}
      </div>
    </div>
  );
};

export default QnA;
