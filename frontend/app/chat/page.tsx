'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import './chat.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: Citation[];
    timestamp: Date;
}

interface Citation {
    doc_id: string;
    page: number;
    chunk_id: string;
    snippet: string;
}

interface Document {
    id: string;
    title: string;
    status: 'uploading' | 'processing' | 'ready' | 'error';
    progress: number;
    uploadTime: Date;
}

interface ChatHistory {
    id: string;
    title: string;
    lastMessage: Date;
}

export default function ChatPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [expandedCitation, setExpandedCitation] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Check if user is logged in
        const user = localStorage.getItem('user');
        if (!user) {
            router.push('/');
            return;
        }

        // Load chat history
        loadChatHistory();
        // Load documents
        loadDocuments();
    }, [router]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadChatHistory = async () => {
        try {
            const response = await fetch('/api/chat/history', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setChatHistory(data.history);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    };

    const loadDocuments = async () => {
        try {
            const response = await fetch('/api/documents', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setDocuments(data.documents);
            }
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);

        // Add temporary document to show upload progress
        const tempDoc: Document = {
            id: `temp-${Date.now()}`,
            title: file.name,
            status: 'uploading',
            progress: 0,
            uploadTime: new Date(),
        };
        setDocuments(prev => [...prev, tempDoc]);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                // Update document with real ID and processing status
                setDocuments(prev =>
                    prev.map(doc =>
                        doc.id === tempDoc.id
                            ? { ...doc, id: data.doc_id, status: 'processing', progress: 50 }
                            : doc
                    )
                );

                // Poll for processing status
                pollUploadStatus(data.job_id, data.doc_id);
            } else {
                // Update to error status
                setDocuments(prev =>
                    prev.map(doc =>
                        doc.id === tempDoc.id ? { ...doc, status: 'error', progress: 0 } : doc
                    )
                );
            }
        } catch (error) {
            console.error('Upload error:', error);
            setDocuments(prev =>
                prev.map(doc =>
                    doc.id === tempDoc.id ? { ...doc, status: 'error', progress: 0 } : doc
                )
            );
        }
    };

    const pollUploadStatus = async (jobId: string, docId: string) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/upload/status/${jobId}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                const data = await response.json();

                if (data.status === 'completed') {
                    setDocuments(prev =>
                        prev.map(doc =>
                            doc.id === docId ? { ...doc, status: 'ready', progress: 100 } : doc
                        )
                    );
                    clearInterval(interval);
                } else if (data.status === 'failed') {
                    setDocuments(prev =>
                        prev.map(doc =>
                            doc.id === docId ? { ...doc, status: 'error', progress: 0 } : doc
                        )
                    );
                    clearInterval(interval);
                } else {
                    // Update progress
                    setDocuments(prev =>
                        prev.map(doc =>
                            doc.id === docId ? { ...doc, progress: data.progress || 50 } : doc
                        )
                    );
                }
            } catch (error) {
                console.error('Status poll error:', error);
                clearInterval(interval);
            }
        }, 2000);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: inputValue,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    query: userMessage.content,
                    scope: 'auto',
                    chat_id: selectedChat,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                const assistantMessage: Message = {
                    id: data.answer_id || `msg-${Date.now()}-assistant`,
                    role: 'assistant',
                    content: data.answer_text,
                    citations: data.citations,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                const errorMessage: Message = {
                    id: `msg-${Date.now()}-error`,
                    role: 'assistant',
                    content: 'Sorry, I encountered an error processing your request.',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Query error:', error);
            const errorMessage: Message = {
                id: `msg-${Date.now()}-error`,
                role: 'assistant',
                content: 'Sorry, I encountered an error processing your request.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/');
    };

    const handleNewChat = () => {
        setMessages([]);
        setSelectedChat(null);
    };

    const loadChat = async (chatId: string) => {
        try {
            const response = await fetch(`/api/chat/${chatId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            if (response.ok) {
                setMessages(data.messages);
                setSelectedChat(chatId);
            }
        } catch (error) {
            console.error('Error loading chat:', error);
        }
    };

    return (
        <div className="chat-page">
            {/* Sidebar */}
            <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <button className="new-chat-btn" onClick={handleNewChat}>
                        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Chat
                    </button>
                </div>

                {/* Chat History Section */}
                <div className="sidebar-section">
                    <h3 className="section-title">Recent Chats</h3>
                    <div className="chat-list">
                        {chatHistory.map(chat => (
                            <button
                                key={chat.id}
                                className={`chat-item ${selectedChat === chat.id ? 'active' : ''}`}
                                onClick={() => loadChat(chat.id)}
                            >
                                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <span className="chat-title">{chat.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Documents Section */}
                <div className="sidebar-section">
                    <div className="section-header">
                        <h3 className="section-title">Documents</h3>
                        <button
                            className="upload-btn-small"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                    <div className="document-list">
                        {documents.map(doc => (
                            <div key={doc.id} className="document-item">
                                <div className="document-icon">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div className="document-info">
                                    <div className="document-title">{doc.title}</div>
                                    <div className="document-status">
                                        {doc.status === 'uploading' && 'Uploading...'}
                                        {doc.status === 'processing' && 'Processing...'}
                                        {doc.status === 'ready' && 'Ready'}
                                        {doc.status === 'error' && 'Error'}
                                    </div>
                                    {(doc.status === 'uploading' || doc.status === 'processing') && (
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${doc.progress}%` }}></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Section */}
                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-main">
                {/* Header */}
                <div className="chat-header">
                    <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="chat-header-title">Agentic RAG Chatbot</h1>
                </div>

                {/* Messages Area */}
                <div className="messages-container">
                    {messages.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <h2>Start a conversation</h2>
                            <p>Upload documents and ask questions about them</p>
                            <button className="upload-btn-large" onClick={() => fileInputRef.current?.click()}>
                                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Upload Document
                            </button>
                        </div>
                    ) : (
                        <div className="messages-list">
                            {messages.map(message => (
                                <div key={message.id} className={`message ${message.role}`}>
                                    <div className="message-avatar">
                                        {message.role === 'user' ? (
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        ) : (
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="message-content">
                                        <div className="message-text">{message.content}</div>
                                        {message.citations && message.citations.length > 0 && (
                                            <div className="citations">
                                                <button
                                                    className="citations-toggle"
                                                    onClick={() =>
                                                        setExpandedCitation(
                                                            expandedCitation === message.id ? null : message.id
                                                        )
                                                    }
                                                >
                                                    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {message.citations.length} source{message.citations.length > 1 ? 's' : ''}
                                                </button>
                                                {expandedCitation === message.id && (
                                                    <div className="citations-panel animate-slideIn">
                                                        {message.citations.map((citation, idx) => (
                                                            <div key={idx} className="citation-item">
                                                                <div className="citation-header">
                                                                    <span className="citation-number">{idx + 1}</span>
                                                                    <span className="citation-page">Page {citation.page}</span>
                                                                </div>
                                                                <div className="citation-snippet">{citation.snippet}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="message assistant">
                                    <div className="message-avatar">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div className="message-content">
                                        <div className="typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="input-container">
                    <form onSubmit={handleSendMessage} className="input-form">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask a question about your documents..."
                            className="message-input"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            className="send-button"
                            disabled={isLoading || !inputValue.trim()}
                        >
                            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.epub,.txt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
            />
        </div>
    );
}
