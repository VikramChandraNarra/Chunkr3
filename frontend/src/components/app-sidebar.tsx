import * as React from "react"
import { useState } from "react"

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

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-list', JSON.stringify(chats));
    }
  }, [chats]);

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
              <SearchForm />
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleCreateChat}
                  aria-label="Create new chat"
                  variant="default"
                  size="icon"
                  className="ml-2 bg-black hover:bg-black/80 text-white"
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
          <ChatScreen key={activeChatId} chatId={activeChatId} />
        </div>
      )}
    </>
  )
}

function ChatScreen({ chatId }: { chatId: string }) {
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
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [model, setModel] = useState("openai/gpt-4o");
  const [chatName, setChatName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [citationModal, setCitationModal] = useState<{ open: boolean; citation: any; idx: number | null }>({ open: false, citation: null, idx: null });

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

  const handleSend = async () => {
    if (input.trim() === "" && !file) return;
    setError(null);
    setLoading(true);
    try {
      // If a file is attached and not already uploaded, ingest it first
      if (file && !uploadedFiles.includes(file.name)) {
        await ingestFile(file);
        setUploadedFiles((prev) => [...prev, file.name]);
      }
      const now = new Date();
      const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Compose user message
      let userText = input;
      if (file) {
        userText = userText ? `${userText}` : `Just respond back to me saying, that the file has been uploaded.`;
      }
      const newUserMessage = { text: userText, role: 'user' as const, timestamp, file: file ? { name: file.name } : null };
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
      setFile(null);
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
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
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
          <div className="text-muted-foreground text-center mt-8">No messages yet.</div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
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
                  {msg.text && <div>{msg.text}</div>}
                  {msg.file && (
                    <div className="flex items-center gap-2 mt-2 bg-white/80 border rounded-lg px-3 py-2 shadow-sm">
                      <Paperclip className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-black truncate max-w-[140px]">{msg.file.name}</span>
                    </div>
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
          ))
        )}
        <div ref={messagesEndRef} />
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
            />
          </label>
          <Button type="submit" size="icon" variant="default" className="bg-black text-white">
            <Send className="w-5 h-5" />
          </Button>
        </div>
        {file && (
          <div className="flex items-center gap-2 mt-2 bg-muted rounded-xl px-4 py-3 shadow-sm border w-fit">
            <Paperclip className="w-6 h-6 text-muted-foreground" />
            <span className="text-base text-black truncate max-w-[160px]">{file.name}</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="ml-2 w-6 h-6 p-0 text-muted-foreground hover:bg-accent"
              onClick={handleRemoveFile}
              aria-label="Remove file"
            >
              ×
            </Button>
          </div>
        )}
      </form>
      {loading && (
        <div className="text-center text-muted-foreground text-xs mt-2">Generating response...</div>
      )}
      {error && (
        <div className="text-center text-destructive text-xs mt-2">{error}</div>
      )}
    </div>
  );
}
