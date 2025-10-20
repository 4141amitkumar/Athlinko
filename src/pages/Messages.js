import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Send, MessageSquareText } from 'lucide-react';
import './Messages.css';

const formatMessageTimestamp = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp.toDate()).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

const Messages = ({ currentUser }) => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!currentUser) return;
        setLoading(true);
        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', currentUser.sub),
            orderBy('lastMessageTimestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setConversations(convos);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    useEffect(() => {
        if (!conversationId) {
            setActiveConversation(null);
            setMessages([]);
            return;
        }

        const markAsRead = async () => {
            const convoRef = doc(db, 'conversations', conversationId);
            await updateDoc(convoRef, {
                [`participantInfo.${currentUser.sub}.lastRead`]: serverTimestamp()
            });
        };

        const getConvoData = async () => {
            const convoRef = doc(db, 'conversations', conversationId);
            const convoSnap = await getDoc(convoRef);
            if (convoSnap.exists()) {
                const convoData = convoSnap.data();
                const otherUserId = convoData.participants.find(p => p !== currentUser.sub);
                setActiveConversation({ id: conversationId, ...convoData.participantInfo[otherUserId] });
            }
        };
        
        getConvoData();
        markAsRead();

        const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'asc'));
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [conversationId, currentUser.sub]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversationId) return;

        const convoRef = doc(db, 'conversations', conversationId);
        const messagesColRef = collection(convoRef, 'messages');

        await addDoc(messagesColRef, {
            senderId: currentUser.sub,
            text: newMessage,
            timestamp: serverTimestamp(),
        });

        await updateDoc(convoRef, {
            lastMessage: newMessage,
            lastMessageTimestamp: serverTimestamp(),
            [`participantInfo.${currentUser.sub}.lastRead`]: serverTimestamp()
        });

        setNewMessage('');
    };

    const getOtherParticipant = (convo) => {
        const otherUserId = convo.participants.find(p => p !== currentUser.sub);
        return convo.participantInfo[otherUserId];
    };

    return (
        <div className="messages-page-container">
            <div className="messages-layout">
                <div className="conversations-list">
                    <div className="conversations-header">
                        <h2>Inbox</h2>
                    </div>
                    {loading ? <p style={{textAlign: 'center', padding: '1rem'}}>Loading conversations...</p> : conversations.map(convo => {
                        const otherUser = getOtherParticipant(convo);
                        const lastRead = convo.participantInfo[currentUser.sub]?.lastRead?.toDate();
                        const lastMessageTime = convo.lastMessageTimestamp?.toDate();
                        const isUnread = lastRead && lastMessageTime && lastMessageTime > lastRead;

                        return (
                            <div
                                key={convo.id}
                                className={`conversation-item ${convo.id === conversationId ? 'active' : ''} ${isUnread ? 'unread' : ''}`}
                                onClick={() => navigate(`/messages/${convo.id}`)}
                            >
                                <img src={otherUser.picture} alt={otherUser.name} />
                                <div className="conversation-info">
                                    <span className="conversation-name">{otherUser.name}</span>
                                    <span className="conversation-last-message">{convo.lastMessage}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="chat-window">
                    {activeConversation ? (
                        <>
                            <div className="chat-header">
                                <img src={activeConversation.picture} alt={activeConversation.name} />
                                <h3>{activeConversation.name}</h3>
                            </div>
                            <div className="messages-area">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`message-wrapper ${msg.senderId === currentUser.sub ? 'sent' : 'received'}`}>
                                        <div className="message-bubble">
                                            <p>{msg.text}</p>
                                        </div>
                                        <span className="message-timestamp">{formatMessageTimestamp(msg.timestamp)}</span>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <form className="message-input-form" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                />
                                <button type="submit"><Send size={20} /></button>
                            </form>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <MessageSquareText />
                            <p>Select a conversation to start messaging.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;

