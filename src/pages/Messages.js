import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, rtdb } from '../firebase'; // RTDB import karein
import { ref, onValue } from 'firebase/database'; // RTDB functions import karein
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore'; 
import { Send, MessageSquareText, Check, CheckCheck } from 'lucide-react';
import { createNotification } from '../utils/notifications'; // Notification helper import
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
    const [otherUserStatus, setOtherUserStatus] = useState({ state: 'offline' });
    const messagesEndRef = useRef(null);

    // Conversations list fetch karein
    useEffect(() => {
        if (!currentUser) return;
        setLoading(true);
        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', currentUser.uid), // Use uid
            orderBy('lastMessageTimestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setConversations(convos);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);
    
    // Active chat aur messages handle karein
    useEffect(() => {
        if (!conversationId || !currentUser) {
            setActiveConversation(null);
            setMessages([]);
            return;
        }

        const getConvoData = async () => {
            const convoRef = doc(db, 'conversations', conversationId);
            const convoSnap = await getDoc(convoRef);
            if (convoSnap.exists()) {
                const convoData = convoSnap.data();
                const otherUserId = convoData.participants.find(p => p !== currentUser.uid); // Use uid
                
                if (otherUserId) {
                    setActiveConversation({ id: conversationId, otherUserId, ...convoData.participantInfo[otherUserId] });
                }
            }
        };
        
        getConvoData();

        // Messages ke liye listener
        const messagesQuery = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'asc'));
        const unsubscribeMessages = onSnapshot(messagesQuery, async (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(msgs);

            // Messages ko 'seen' mark karein (Client-side logic)
            const batch = writeBatch(db);
            let updatesMade = false;
            snapshot.forEach(document => {
                const message = document.data();
                if (message.senderId !== currentUser.uid && message.status !== 'seen') { // Use uid
                    const messageRef = doc(db, 'conversations', conversationId, 'messages', document.id);
                    batch.update(messageRef, { status: 'seen' });
                    updatesMade = true;
                }
            });

            if (updatesMade) {
                // lastRead timestamp ko bhi update karein taaki unread count fix ho
                const convoRef = doc(db, 'conversations', conversationId);
                batch.update(convoRef, {
                    [`participantInfo.${currentUser.uid}.lastRead`]: serverTimestamp()
                });
                await batch.commit();
            }
        });

        return () => unsubscribeMessages();
    }, [conversationId, currentUser]);

    // Other user ke online status ke liye listener
    useEffect(() => {
        if (activeConversation?.otherUserId) {
            const statusRef = ref(rtdb, `/status/${activeConversation.otherUserId}`);
            const unsubscribeStatus = onValue(statusRef, (snapshot) => {
                const status = snapshot.val();
                setOtherUserStatus(status || { state: 'offline' });
            });

            return () => unsubscribeStatus();
        }
    }, [activeConversation]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversationId) return;

        const convoRef = doc(db, 'conversations', conversationId);
        const messagesColRef = collection(convoRef, 'messages');

        const newMsgTimestamp = serverTimestamp();

        await addDoc(messagesColRef, {
            senderId: currentUser.uid, // Use uid
            text: newMessage,
            timestamp: newMsgTimestamp,
            status: 'sent' // Initial status
        });

        await updateDoc(convoRef, {
            lastMessage: newMessage,
            lastMessageSenderId: currentUser.uid, // Track karein ki last message kisne bheja
            lastMessageTimestamp: newMsgTimestamp,
            [`participantInfo.${currentUser.uid}.lastRead`]: newMsgTimestamp // Sender ne toh padh hi liya
        });

        // ** NOTIFICATION TRIGGER **
        const otherUserId = activeConversation?.otherUserId;
        if (otherUserId) {
            createNotification(
                otherUserId,
                `New message from ${currentUser.name}`,
                `/messages/${conversationId}`
            );
        }

        setNewMessage('');
    };
    
    const getOtherParticipant = (convo) => {
        const otherUserId = convo.participants.find(p => p !== currentUser.uid); // Use uid
        return convo.participantInfo[otherUserId];
    };
    
    // Status ticks render karne ke liye function
    const renderMessageStatus = (msg) => {
        if (msg.senderId !== currentUser.uid) return null; // Use uid
        if (msg.status === 'seen') {
            return <CheckCheck size={16} className="status-icon seen" />;
        }
        if (msg.status === 'sent' || msg.status === 'delivered') {
            return <Check size={16} className="status-icon" />;
        }
        return null;
    };

    return (
        <div className="messages-page-container">
            <div className="messages-layout">
                <div className="conversations-list">
                    {/* ... conversations list JSX ... */}
                     <div className="conversations-header">
                        <h2>Inbox</h2>
                    </div>
                    {loading ? <p style={{textAlign: 'center', padding: '1rem'}}>Loading conversations...</p> : conversations.map(convo => {
                        const otherUser = getOtherParticipant(convo);
                        if (!otherUser) return null; // Add guard for missing participant info
                        const lastRead = convo.participantInfo[currentUser.uid]?.lastRead?.toDate(); // Use uid
                        const lastMessageTime = convo.lastMessageTimestamp?.toDate();
                        
                        // Check if unread (and not sent by me)
                        const isUnread = convo.lastMessageSenderId !== currentUser.uid &&
                                         ((lastRead && lastMessageTime && lastMessageTime > lastRead) || 
                                          (!lastRead && convo.lastMessage));

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
                                <div className="chat-header-info">
                                  <h3>{activeConversation.name}</h3>
                                  <div className="chat-status">
                                      <span className={`status-dot ${otherUserStatus.state}`}></span>
                                      <span>{otherUserStatus.state}</span>
                                  </div>
                                </div>
                            </div>
                            <div className="messages-area">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`message-wrapper ${msg.senderId === currentUser.uid ? 'sent' : 'received'}`}>
                                        <div className="message-bubble">
                                            <p>{msg.text}</p>
                                        </div>
                                        <span className="message-timestamp">
                                            {formatMessageTimestamp(msg.timestamp)}
                                            {renderMessageStatus(msg)}
                                        </span>
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