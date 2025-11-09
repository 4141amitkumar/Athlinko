import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import QuestionCard from '../components/QuestionCard'; // Corrected path
import './QnA.css';

const QnA = ({ currentUser }) => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true); // Start loading
    const q = query(collection(db, 'qna'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const questionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQuestions(questionsData);
      setLoading(false); // Stop loading
    }, (error) => { // Add error handling
        console.error("Error fetching QnA:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
     // Add check for currentUser and currentUser.uid
    if (!currentUser?.uid) {
        alert("You must be logged in to ask a question.");
        return;
    }
    if (!newQuestion.trim()) return;

    try {
      await addDoc(collection(db, 'qna'), {
        questionText: newQuestion,
        asker: {
          id: currentUser.uid, // Use uid
          name: currentUser.name, // Ensure 'name' is correct
          picture: currentUser.picture, // Ensure 'picture' is correct
          role: currentUser.role, // Ensure 'role' is correct
        },
        answers: [],
        timestamp: serverTimestamp(),
      });
      setNewQuestion(''); // Clear input on success
    } catch (error) {
      console.error("Error posting question: ", error);
      alert("Failed to post question. Please try again.");
    }
  };

  return (
    <div className="qna-page-container">
      <div className="qna-header">
        <h1>Ask an Expert</h1>
        <p>Get advice from experienced coaches and players in the community.</p>
      </div>

      {/* Ensure currentUser exists before showing form */}
      {currentUser && (
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
       )}

      <div className="questions-list">
        {loading ? (
          <p>Loading questions...</p>
        ) : questions.length > 0 ? (
           // Pass currentUser object which now includes uid
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
