import * as React from "react"
import { useState, useRef, useEffect } from "react"
import ReactMarkdown from 'react-markdown'

import { SearchForm } from "@/components/search-form"
import { VersionSwitcher } from "@/components/version-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Paperclip, Send, Trash2, Pencil } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Search } from "lucide-react"
import { useToast } from "@/components/toast"

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Chats",
      url: "#",
      items: [], // No initial chats
    },
  ],
}

function MessageSearch({ chats, onSelect }: { chats: { id: string; name: string }[]; onSelect: (chatId: string, messageIdx: number) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setOpen(false);
      return;
    }
    // Gather all messages from all chats
    const allResults: any[] = [];
    chats.forEach(chat => {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(`chat-${chat.id}`) : null;
      if (!raw) return;
      try {
        const messages = JSON.parse(raw);
        messages.forEach((msg: any, idx: number) => {
          if (msg.text && msg.text.toLowerCase().includes(query.toLowerCase())) {
            allResults.push({
              chatId: chat.id,
              chatName: chat.name,
              messageIdx: idx,
              text: msg.text,
              timestamp: msg.timestamp,
              role: msg.role,
            });
          }
        });
      } catch {}
    });
    setResults(allResults);
    setOpen(true);
  }, [query, chats]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        className="pl-8 pr-2"
        placeholder="Search all messages..."
        data-tour="search-input"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => query && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full max-h-80 overflow-auto rounded-md border bg-popover shadow-lg animate-in fade-in-80">
          {results.map((r, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-3 hover:bg-accent/60 focus:bg-accent/80 transition-colors border-b last:border-b-0 border-muted flex flex-col gap-1"
              onMouseDown={e => { e.preventDefault(); onSelect(r.chatId, r.messageIdx); setOpen(false); setQuery(""); }}
            >
              <span className="text-sm text-foreground line-clamp-2">{r.text}</span>
              <span className="text-xs text-muted-foreground flex justify-between">
                <span>{r.chatName}</span>
                <span>{r.timestamp}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {open && query && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-lg animate-in fade-in-80 px-4 py-3 text-muted-foreground text-sm">No results found.</div>
      )}
    </div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [chats, setChats] = useState<{ id: string; name: string }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chat-list');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatName, setEditingChatName] = useState<string>("");
  const [scrollToMessageIdx, setScrollToMessageIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-list', JSON.stringify(chats));
    }
  }, [chats]);

  React.useEffect(() => {
    if (fileInputRef.current) {
      // @ts-ignore
      fileInputRef.current.webkitdirectory = true;
      // @ts-ignore
      fileInputRef.current.directory = true;
    }
  }, []);

  const handleCreateChat = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const name = id;
    setChats((prev) => [...prev, { id, name }]);
    setActiveChatId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`chat-${id}`, JSON.stringify([]));
    }
  };

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    setEditingChatId(null);
  };

  const handleDeleteChat = (id: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`chat-${id}`);
    }
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };

  const handleEditChat = (id: string, name: string) => {
    setEditingChatId(id);
    setEditingChatName(name);
  };

  const handleEditChatNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingChatName(e.target.value);
  };

  const handleEditChatNameSave = (id: string) => {
    setChats((prev) => prev.map((chat) => chat.id === id ? { ...chat, name: editingChatName.trim() || chat.name } : chat));
    setEditingChatId(null);
  };

  const handleEditChatNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      handleEditChatNameSave(id);
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };

  return (
    <>
      <Sidebar {...props}>
        <SidebarHeader>
          <VersionSwitcher
            versions={data.versions}
            defaultVersion={data.versions[0]}
          />
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div style={{ flex: 1 }}>
              <MessageSearch
                chats={chats}
                onSelect={(chatId, messageIdx) => {
                  setActiveChatId(chatId);
                  setScrollToMessageIdx(messageIdx);
                }}
              />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleCreateChat}
                  aria-label="Create new chat"
                  variant="default"
                  size="icon"
                  className="ml-2 bg-black hover:bg-black/80 text-white"
                  data-tour="new-chat"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup key="Chats">
            <SidebarGroupLabel>Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={activeChatId === chat.id}
                    >
                      <div className="flex items-center w-full gap-2 group">
                        {editingChatId === chat.id ? (
                          <input
                            className="flex-1 rounded px-2 py-1 text-sm border focus:outline-none focus:ring-2 focus:ring-ring"
                            value={editingChatName}
                            autoFocus
                            onChange={handleEditChatNameChange}
                            onBlur={() => handleEditChatNameSave(chat.id)}
                            onKeyDown={e => handleEditChatNameKeyDown(e, chat.id)}
                          />
                        ) : (
                          <button
                            className="flex-1 text-left truncate text-sm"
                            onClick={() => handleSelectChat(chat.id)}
                          >
                            {chat.name}
                          </button>
                        )}
                        <button
                          className="p-1 rounded hover:bg-accent"
                          onClick={() => handleEditChat(chat.id, chat.name)}
                          title="Edit chat name"
                          tabIndex={-1}
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-destructive/10"
                          onClick={() => handleDeleteChat(chat.id)}
                          title="Delete chat"
                          tabIndex={-1}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      {activeChatId && (
        <div className="fixed left-[var(--sidebar-width,16rem)] top-0 h-full w-[calc(100vw-var(--sidebar-width,16rem))] z-40">
          <ChatScreen key={activeChatId} chatId={activeChatId} scrollToMessageIdx={scrollToMessageIdx} onScrolled={() => setScrollToMessageIdx(null)} />
        </div>
      )}
    </>
  )
}

function ChatScreen({ chatId, scrollToMessageIdx, onScrolled }: { chatId: string, scrollToMessageIdx?: number | null, onScrolled?: () => void }) {
  const [messages, setMessages] = useState<{
    text: string;
    role: 'user' | 'assistant';
    timestamp: string;
    file?: { name: string } | null;
    citations?: Array<{ page: number; chunk_id: string; content: string }>;
  }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`chat-${chatId}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [model, setModel] = useState("openai/gpt-4o");
  const [chatName, setChatName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [citationModal, setCitationModal] = useState<{ open: boolean; citation: any; idx: number | null }>({ open: false, citation: null, idx: null });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const messageRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const { addToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`chat-${chatId}`, JSON.stringify(messages));
    }
  }, [messages, chatId]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const chatList = localStorage.getItem('chat-list');
      if (chatList) {
        const found = JSON.parse(chatList).find((c: { id: string; name: string }) => c.id === chatId);
        setChatName(found ? found.name : chatId);
      }
    }
  }, [chatId]);

  // Scroll to a specific message if requested
  React.useEffect(() => {
    if (scrollToMessageIdx != null && messageRefs.current[scrollToMessageIdx]) {
      messageRefs.current[scrollToMessageIdx]?.scrollIntoView({ behavior: "smooth", block: "center" });
      onScrolled && onScrolled();
    }
  }, [scrollToMessageIdx, messages, onScrolled]);

  // Helper to upload a file to /api/ingest
  const ingestFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chat_id', chatId);
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/ingest`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to ingest file');
    return await res.json();
  };

  // Helper to check if files are indexed in Pinecone
  const checkFilesIndexed = async (fileNames: string[]) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/check_indexed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          file_names: fileNames
        })
      });
      if (!res.ok) return false;
      const data = await res.json();
      return data.indexed;
    } catch (err) {
      return false;
    }
  };

  const handleSend = async () => {
    // Check for files without text
    if (files.length > 0 && input.trim() === "") {
      addToast({
        title: "Missing prompt",
        description: "Please enter a prompt to analyze the uploaded files.",
        variant: "destructive",
      });
      return;
    }

    if (input.trim() === "" && files.length === 0) return;
    setError(null);
    setLoading(true);
    try {
      // Ingest all files concurrently if not already uploaded
      const filesToUpload = files.filter(f => !uploadedFiles.includes(f.name));
      if (filesToUpload.length > 0) {
        // First, ingest all files
        await Promise.all(filesToUpload.map(async (file) => {
          await ingestFile(file);
          setUploadedFiles(prev => [...prev, file.name]);
        }));

        // Then wait for files to be indexed with timeout
        const fileNames = filesToUpload.map(f => f.name);
        let indexed = false;
        let attempts = 0;
        const maxAttempts = 10; // Maximum 10 attempts
        const delay = 1000; // 1 second between attempts

        while (!indexed && attempts < maxAttempts) {
          indexed = await checkFilesIndexed(fileNames);
          if (!indexed) {
            await new Promise(resolve => setTimeout(resolve, delay));
            attempts++;
          }
        }

        if (!indexed) {
          throw new Error("Files are taking too long to process. Please try again in a moment.");
        }
      }

      // Only after all files are ingested and indexed, send the chat message
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Compose user message
      let userText = input;
      if (files.length > 0) {
        userText = userText ? `${userText}` : `Enter a valid text`;
      }
      const newUserMessage = { text: userText, role: 'user' as const, timestamp, file: files.length > 0 ? { name: files.map(f => f.name).join(', ') } : null };
      // Prepare backend messages
      const backendMessages = [
        ...messages,
        newUserMessage
      ].map((msg) => ({
        role: msg.role,
        content: msg.text,
        parts: [ { type: 'text', text: msg.text } ]
      }));
      // Optimistically add user message
      setMessages((prev) => [...prev, newUserMessage]);
      setInput("");
      setFiles([]);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: chatId,
            messages: backendMessages,
            model,
          }),
        });
        if (!res.ok) throw new Error("Failed to get response from AI");
        const data = await res.json();
        const aiText = data.answer || "";
        const aiCitations = data.citations || [];
        const aiTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages((prev) => [
          ...prev,
          { text: aiText, role: 'assistant', timestamp: aiTimestamp, citations: aiCitations }
        ]);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (name: string) => {
    setFiles(files => files.filter(f => f.name !== name));
  };

  return (
    <div className="flex flex-col h-full bg-background/95">
      <div className="bg-muted/50 border-b px-4 py-3">
        <div className="font-semibold text-lg text-center">
          {chatName}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh]">
            <form
              className="w-full max-w-xl flex flex-col items-center gap-4"
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
            >
              <div className="w-full bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center px-6 py-4 gap-3">
                <label htmlFor="file-upload-centered" className="cursor-pointer" data-tour="file-upload2">
                  <Paperclip className="w-5 h-5 text-muted-foreground" />
                  <input
                    id="file-upload-centered"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    multiple
                    ref={fileInputRef}
                  />
                </label>
                <Input
                  className="flex-1 border-none focus:ring-2 focus:ring-primary text-lg bg-transparent placeholder:text-muted-foreground rounded-xl"
                  placeholder="Ask AI anything..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  autoFocus
                  data-tour="chat-input"
                />
                <Button type="submit" size="icon" variant="default" className="bg-black text-white rounded-xl shadow">
                  <Send className="w-6 h-6" />
                </Button>
              </div>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {files.map((file) => (
                    <div key={file.name} className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2 shadow-sm border w-fit">
                      <Paperclip className="w-5 h-5 text-muted-foreground" />
                      <span className="text-base text-black truncate max-w-[160px]">{file.name}</span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="ml-2 w-6 h-6 p-0 text-muted-foreground hover:bg-accent"
                        onClick={() => handleRemoveFile(file.name)}
                        aria-label="Remove file"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                ref={el => { messageRefs.current[idx] = el; }}
                className={
                  msg.role === 'user'
                    ? 'flex justify-end'
                    : 'flex justify-start'
                }
              >
                <div className="flex flex-col items-end max-w-[60%]">
                  <div
                    className={
                      msg.role === 'user'
                        ? 'bg-[#18181b] text-white rounded-2xl px-6 py-3 text-base shadow-md'
                        : 'bg-[#f4f4f5] text-black rounded-2xl px-6 py-3 text-base shadow-md'
                    }
                    style={{ borderRadius: 16 }}
                  >
                    {/* Show files above the text, each as a separate box */}
                    {msg.file && msg.file.name && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(Array.isArray(msg.file.name) ? msg.file.name : msg.file.name.split(",")).map((fileName: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-white/80 border rounded-lg px-3 py-2 shadow-sm">
                            <Paperclip className="w-5 h-5 text-muted-foreground" />
                            <span className="text-sm text-black truncate max-w-[140px]">{fileName.trim()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.text && (
                      msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none text-black">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      ) : (
                        <div>{msg.text}</div>
                      )
                    )}
                    {/* Citations for assistant messages */}
                    {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 text-xs">
                        {msg.citations.map((citation, cidx) => (
                          <Button
                            key={cidx}
                            type="button"
                            variant="link"
                            className="px-1 py-0 h-auto text-muted-foreground hover:text-primary focus-visible:ring-1 focus-visible:ring-ring"
                            onClick={() => setCitationModal({ open: true, citation, idx: cidx })}
                          >
                            [{cidx + 1}]
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1" style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>{msg.timestamp}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      {/* Citation Modal */}
      {citationModal.open && citationModal.citation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={() => setCitationModal({ open: false, citation: null, idx: null })}
              aria-label="Close citation details"
            >
              ×
            </button>
            <div className="mb-2 font-semibold text-gray-800">Citation [{citationModal.idx !== null ? citationModal.idx + 1 : ''}]</div>
            <div className="mb-2 text-sm text-gray-700 whitespace-pre-line"><b>Content:</b> {citationModal.citation.content}</div>
            <div className="mb-1 text-xs text-gray-500"><b>Chunk ID:</b> {citationModal.citation.chunk_id}</div>
            <div className="mb-1 text-xs text-gray-500"><b>Page:</b> {citationModal.citation.page}</div>
          </div>
        </div>
      )}
      {/* Only render the bottom input when there are messages */}
      {messages.length > 0 && (
        <form
          className="flex flex-col gap-2 border-t p-4 bg-background"
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
        >
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <Input
                className="flex-1 border pr-36 focus:ring-0 text-base"
                placeholder="Ask AI..."
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-32 bg-transparent border-none text-xs text-muted-foreground hover:text-foreground focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai/gpt-4o">openai/gpt-4o</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Paperclip className="w-5 h-5 text-muted-foreground" />
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                multiple
                ref={fileInputRef}
              />
            </label>
            <Button type="submit" size="icon" variant="default" className="bg-black text-white">
              <Send className="w-5 h-5" />
            </Button>
          </div>
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {files.map((file) => (
                <div key={file.name} className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2 shadow-sm border w-fit">
                  <Paperclip className="w-5 h-5 text-muted-foreground" />
                  <span className="text-base text-black truncate max-w-[160px]">{file.name}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="ml-2 w-6 h-6 p-0 text-muted-foreground hover:bg-accent"
                    onClick={() => handleRemoveFile(file.name)}
                    aria-label="Remove file"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </form>
      )}
      {loading && (
        <div className="text-center text-muted-foreground text-xs mt-2">Generating response...</div>
      )}
      {error && (
        <div className="text-center text-destructive text-xs mt-2">{error}</div>
      )}
    </div>
  );
}
