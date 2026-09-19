import { useEffect, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  FileText,
  Loader2,
  MessageCircle,
  Paperclip,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  AlertCircle,
  MessageSquarePlus,
  RefreshCw,
  LogOut,
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useAuth } from "./context/AuthContext";
import AuthPage from "./page/authPage";

const initialMessages = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hi! Upload a PDF and ask questions about it. I’ll answer using the information retrieved from your document.",
  },
];

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((n) => (
        <span key={n} className="dot h-2 w-2 rounded-full bg-slate-400" />
      ))}
    </div>
  );
}

function App() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState(initialMessages);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [chats, setChats] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);
  const [deletingChatId, setDeletingChatId] = useState(null);

  const { user, loading, token, logout } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  const API_BASE = import.meta.env.VITE_BASE_URL;

  const loadDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const response = await fetch(`${API_BASE}/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load documents.");
      }

      setDocuments(data.documents || []);
    } catch (err) {
      setError(
        err.message.includes("Failed to fetch")
          ? "Cannot reach the RAG server."
          : err.message,
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  const loadChats = async () => {
    setLoadingChats(true);
    try {
      const response = await fetch(`${API_BASE}/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load chats.");
      }

      setChats(data.chats || []);
    } catch (err) {
      setError(
        err.message.includes("Failed to fetch")
          ? "Cannot reach the RAG server."
          : err.message,
      );
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadChats();
    startNewChat();
  }, [user]);

  const startNewChat = () => {
    setSessionId(null);
    setMessages([...initialMessages]);
    setQuestion("");
    setError("");
  };

  const loadChat = async (chatId) => {
    setError("");
    try {
      const response = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load chat.");
      }

      setSessionId(chatId);
      setSelectedDocumentId(data.chat?.documentIds?.[0] || null);

      const loadedMessages = (data.messages || []).map((message) => ({
        id: message._id,
        role: message.role,
        content: message.content,
        sources: message.sources || [],
      }));

      setMessages(loadedMessages.length ? loadedMessages : initialMessages);
    } catch (err) {
      setError(
        err.message.includes("Failed to fetch")
          ? "Cannot reach the RAG server."
          : err.message,
      );
    }
  };

  const deleteChat = async (chatId, event) => {
    event?.stopPropagation();
    setDeletingChatId(chatId);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/chats/${chatId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete chat.");
      }

      setChats((prev) => prev.filter((chat) => chat._id !== chatId));

      if (sessionId === chatId) {
        setSessionId(null);
        setMessages(initialMessages);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingChatId(null);
    }
  };

  const deleteDocument = async (documentId) => {
    const document = documents.find((item) => item.documentId === documentId);
    if (!document) return;

    const confirmed = window.confirm(
      `Delete "${document.fileName}" from the knowledge base?`,
    );

    if (!confirmed) return;

    setDeletingDocumentId(documentId);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete PDF.");
      }

      setDocuments((prev) =>
        prev.filter((item) => item.documentId !== documentId),
      );

      if (selectedDocumentId === documentId) {
        setSelectedDocumentId(null);
      }

      // The PDF is gone from Qdrant. Keep existing chat history.
      if (sessionId) {
        await loadChat(sessionId);
      }
    } catch (err) {
      setError(
        err.message.includes("Failed to fetch")
          ? "Cannot reach the RAG server."
          : err.message,
      );
    } finally {
      setDeletingDocumentId(null);
    }
  };

  const selectFile = (selected) => {
    if (!selected) return;
    setError("");
    if (selected.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }
    if (selected.size > 15 * 1024 * 1024) {
      setError("PDF must be smaller than 15 MB.");
      return;
    }
    setFile(selected);
  };

  const uploadPdf = async () => {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("pdf", file);

      const response = await fetch(`${API_BASE}/documents`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Upload failed.");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Upload failed.");
      }

      await loadDocuments();
      setSelectedDocumentId(data.documentId);

      if (!sessionId) {
        await startNewChat();
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: `${file.name} is uploaded and ready for questions.`,
        },
      ]);
    } catch (err) {
      setError(
        err.message.includes("Failed to fetch")
          ? "Cannot reach the RAG server. Make sure server.js is running on port 5000."
          : err.message,
      );
    } finally {
      setUploading(false);
    }
  };

  const askQuestion = async (event) => {
    event?.preventDefault();
    const input = question.trim();
    if (!input || asking) return;

    setError("");
    setQuestion("");

    let activeSessionId = sessionId;

    if (!activeSessionId) {
      try {
        const createResponse = await fetch(`${API_BASE}/chats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: input.slice(0, 60),
            documentIds: documents[0]?.documentId
              ? [documents[0].documentId]
              : [],
          }),
        });

        const createData = await createResponse.json();

        if (!createResponse.ok) {
          throw new Error(createData.message || "Failed to create chat.");
        }

        activeSessionId = createData.chat._id;
        setSessionId(activeSessionId);
        setChats((prev) => [createData.chat, ...prev]);
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setAsking(true);

    try {
      const response = await fetch(`${API_BASE}/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          input,
          documentId: selectedDocumentId,
          sessionId: activeSessionId,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Question request failed.");
      }

      const data = await response.json();
      const answer =
        data["ai "] ??
        data.ai ??
        data.response ??
        data.answer ??
        "I couldn't find an answer in the uploaded PDF.";

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: typeof answer === "string" ? answer : JSON.stringify(answer),
          sources: data.sources || [],
        },
      ]);

      await loadChats();
    } catch (err) {
      setError(
        err.message.includes("Failed to fetch")
          ? "Cannot reach the RAG server. Make sure server.js is running on port 5000."
          : err.message,
      );
    } finally {
      setAsking(false);
    }
  };

  const clearChat = async () => {
    setError("");
    await startNewChat();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage showRegister={showRegister} setShowRegister={setShowRegister} />
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-x-hidden bg-white">
      <header className=" border-b-2 border-slate-500 bg-slate-950 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl gap-2 px-2 py-3 sm:gap-2 sm:px-6 sm:py-4">
          {/* LEFT: Logo + Title */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-400 text-white shadow-sm sm:h-10 sm:w-10">
              <Sparkles size={18} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
                RAG PDF Assistant
              </h1>

              <p className="hidden text-xs text-slate-500 sm:block">
                Ask questions from your documents
              </p>
            </div>
          </div>

          {/* RIGHT: Profile + Actions */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* User Profile */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1.5 sm:gap-2 sm:px-3 sm:py-2">
              {/* Avatar */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white sm:h-8 sm:w-8">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              {/* User Information */}
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-[110px] truncate text-sm font-semibold text-slate-800">
                  {user?.name || "User"}
                </p>

                <p className="max-w-[140px] truncate text-[11px] text-slate-500">
                  {user?.email || ""}
                </p>
              </div>
            </div>

            {/* Clear Chat */}
            <button
              onClick={clearChat}
              title="Clear chat"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-white transition hover:bg-white hover:text-slate-950 sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2"
            >
              <Trash2 size={15} />

              <span className="hidden text-sm font-medium sm:inline">
                Clear chat
              </span>
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              title="Logout"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2"
            >
              <LogOut size={15} />

              <span className="hidden text-sm font-medium sm:inline">
                Logout
              </span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl gap-5 p-4 sm:p-6 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-950 p-5 shadow-soft">
          <div className="mb-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-white">
              Knowledge source
            </p>
            <h2 className="text-lg font-bold text-white">Upload your PDF</h2>
            <p className="mt-1 text-sm leading-5 text-green-400">
              The document becomes the knowledge source for your questions.
            </p>
          </div>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              selectFile(e.dataTransfer.files?.[0]);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
              dragging
                ? "border-slate-900 bg-slate-50"
                : "border-slate-200 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => selectFile(e.target.files?.[0])}
            />
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <UploadCloud size={22} />
            </div>
            <p className="text-sm font-semibold text-green-600">
              Drop PDF here
            </p>
            <p className="mt-1 text-xs text-slate-400">
              or click to browse • max 15 MB
            </p>
          </label>

          {file && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-red-500 shadow-sm">
                  <FileText size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {file.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                  aria-label="Remove file"
                >
                  <X size={16} />
                </button>
              </div>

              <button
                onClick={uploadPdf}
                disabled={uploading}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing PDF...
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    Upload & index
                  </>
                )}
              </button>
            </div>
          )}

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white">
                  Uploaded PDFs
                </p>
                <p className="text-xs text-white">
                  {documents.length} document{documents.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                onClick={loadDocuments}
                disabled={loadingDocuments}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                title="Refresh documents"
              >
                <RefreshCw
                  size={14}
                  className={loadingDocuments ? "animate-spin" : ""}
                />
              </button>
            </div>

            <div className="space-y-2">
              {documents.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-black">
                  No PDFs uploaded yet.
                </p>
              ) : (
                documents.map((document) => (
                  <div
                    key={document.documentId}
                    onClick={() => setSelectedDocumentId(document.documentId)}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 ${
                      selectedDocumentId === document.documentId
                        ? "border-slate-400 bg-slate-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-500">
                      <FileText size={15} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-xs font-semibold text-slate-700"
                        title={document.fileName}
                      >
                        {document.fileName}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {document.chunks} chunks
                      </p>
                    </div>

                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteDocument(document.documentId);
                      }}
                      disabled={deletingDocumentId === document.documentId}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Delete PDF"
                    >
                      {deletingDocumentId === document.documentId ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white">
                  Previous chats
                </p>
                <p className="text-xs text-white">
                  {chats.length} saved chat{chats.length === 1 ? "" : "s"}
                </p>
              </div>

              <button
                onClick={startNewChat}
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
              >
                <MessageSquarePlus size={13} />
                New
              </button>
            </div>

            <div className="max-h-56 space-y-1.5 overflow-y-auto p-1 rounded-lg bg-white">
              {loadingChats ? (
                <div className="flex items-center gap-2 px-2 py-3 text-xs text-slate-400">
                  <Loader2 size={14} className="animate-spin" />
                  Loading chats...
                </div>
              ) : chats.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-3 text-xs text-black">
                  No saved chats yet.
                </p>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat._id}
                    onClick={() => loadChat(chat._id)}
                    className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition ${
                      sessionId === chat._id
                        ? "bg-slate-400 text-slate-900"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <MessageCircle
                      size={14}
                      className="shrink-0 text-slate-700"
                    />

                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-black">
                      {chat.title || "New chat"}
                    </span>

                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => deleteChat(chat._id, event)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          deleteChat(chat._id, event);
                        }
                      }}
                      className="rounded p-1 text-black opacity-100 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                      title="Delete chat"
                    >
                      {deletingChatId === chat._id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 p-3.5">
            <div className="flex gap-2.5">
              <CheckCircle2
                className="mt-0.5 shrink-0 text-emerald-600"
                size={17}
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">RAG mode</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  Answers are generated from retrieved document context.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="flex min-h-[650px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-soft">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-green-700">
                <MessageCircle size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Document chat</h2>
                <p className="text-xs text-slate-400">
                  {sessionId
                    ? "Saved conversation"
                    : "Start a new conversation"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Ready
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="space-y-5 p-5 sm:p-7">
              {messages.map((message) => {
                const isUser = message.role === "user";
                const isSystem = message.role === "system";
                const isAssistant = message.role === "assistant";

                if (isSystem) {
                  return (
                    <div
                      key={message.id}
                      className="mx-auto flex max-w-xl items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700"
                    >
                      <CheckCircle2 size={14} />
                      <div>{message.content}</div>
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                        <Bot size={16} />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                        isUser
                          ? "rounded-br-md bg-slate-900 text-white"
                          : "rounded-bl-md bg-slate-100 text-slate-700"
                      }`}
                    >
                      {isAssistant ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        message.content
                      )}
                    </div>

                    {isUser && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                        You
                      </div>
                    )}
                  </div>
                );
              })}

              {asking && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                    <Bot size={16} />
                  </div>

                  <div className="rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3">
                    <LoadingDots />
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mx-5 mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 sm:mx-6">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={askQuestion}
            className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5"
          >
            <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-slate-400">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mb-0.5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                title="Attach PDF"
              >
                <Paperclip size={19} />
              </button>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={asking}
                placeholder="Ask something about your PDF..."
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!question.trim() || asking}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send question"
              >
                {asking ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
            <p className="mt-2 px-1 text-center text-[11px] text-slate-900">
              Ask precise questions for better retrieval results.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}

export default App;
