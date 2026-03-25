'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const GROUPS = [
  { id: '-5165806246', name: 'Comando Central', emoji: '⚡' },
  { id: '-5058435783', name: 'Panteão Digital', emoji: '🏛️' },
  { id: '-5172114972', name: 'AgiSales', emoji: '📈' },
  { id: '-5179635546', name: 'Colorimetria', emoji: '🎨' },
  { id: '-5151394904', name: 'Consórcio', emoji: '🏠' },
  { id: '-5137285968', name: 'Feedback', emoji: '💬' },
];

interface Message {
  id: string;
  chat_id: string;
  chat_name: string;
  message_id: number;
  from_id: string;
  from_name: string;
  from_username: string | null;
  text: string | null;
  date: string;
  is_bot: boolean;
  reply_to_message_id: number | null;
  created_at: string;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hoje';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
  return d.toLocaleDateString('pt-BR');
}

export default function ComunicacaoPage() {
  const [selectedGroup, setSelectedGroup] = useState(GROUPS[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadedGroups, setLoadedGroups] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages for selected group
  const loadMessages = useCallback(async (chatId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('date', { ascending: true })
      .limit(100);
    if (data) {
      setMessages(data);
      setLoadedGroups(prev => prev.includes(chatId) ? prev : [...prev, chatId]);
      setUnreadCounts(prev => ({ ...prev, [chatId]: 0 }));
    }
  }, []);

  // Load unread counts
  const loadUnreadCounts = useCallback(async () => {
    const counts: Record<string, number> = {};
    for (const group of GROUPS) {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', group.id);
      counts[group.id] = count || 0;
    }
    setUnreadCounts(counts);
  }, []);

  useEffect(() => {
    loadMessages(selectedGroup);
  }, [selectedGroup, loadMessages]);

  useEffect(() => {
    loadUnreadCounts();
  }, [loadUnreadCounts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.chat_id === selectedGroup) {
          setMessages(prev => [...prev, newMsg]);
        } else {
          setUnreadCounts(prev => ({
            ...prev,
            [newMsg.chat_id]: (prev[newMsg.chat_id] || 0) + 1,
          }));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedGroup]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    try {
      await supabase.from('outbox').insert({
        chat_id: selectedGroup,
        text: inputText.trim(),
        status: 'pending',
      });
      setInputText('');
    } finally {
      setSending(false);
    }
  };

  const handleCreateTask = async (msg: Message) => {
    const title = msg.text?.slice(0, 100) || 'Task from Telegram';
    const SVC = supabaseAnonKey;
    await fetch(`${supabaseUrl}/rest/v1/tasks`, {
      method: 'POST',
      headers: {
        apikey: SVC,
        Authorization: `Bearer ${SVC}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        title,
        description: `Criado a partir de mensagem de ${msg.from_name} no grupo ${msg.chat_name}:\n\n${msg.text}`,
        status: 'backlog',
        agent_id: 'hefesto',
        vertical: 'INT',
      }),
    });
    alert(`Task criada: "${title}"`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  let lastDate = '';
  for (const msg of messages) {
    const dateLabel = formatDate(msg.date);
    if (dateLabel !== lastDate) {
      groupedMessages.push({ date: dateLabel, msgs: [] });
      lastDate = dateLabel;
    }
    groupedMessages[groupedMessages.length - 1].msgs.push(msg);
  }

  const selectedGroupInfo = GROUPS.find(g => g.id === selectedGroup);

  return (
    <div className="flex h-screen bg-[#080808] text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 border-r border-zinc-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-lg font-bold text-[#D4AF37]">💬 Comunicação</h1>
          <p className="text-xs text-zinc-500 mt-1">Inbox unificado Telegram</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {GROUPS.map(group => (
            <button
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-900 ${
                selectedGroup === group.id ? 'bg-zinc-900 border-l-2 border-[#D4AF37]' : ''
              }`}
            >
              <span className="text-xl">{group.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-zinc-100 truncate">{group.name}</div>
              </div>
              {(unreadCounts[group.id] || 0) > 0 && (
                <span className="bg-[#D4AF37] text-black text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                  {unreadCounts[group.id] > 99 ? '99+' : unreadCounts[group.id]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
          <span className="text-2xl">{selectedGroupInfo?.emoji}</span>
          <div>
            <h2 className="font-bold text-white">{selectedGroupInfo?.name}</h2>
            <p className="text-xs text-zinc-500">{selectedGroupInfo?.id}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {groupedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600">
              <p className="text-4xl mb-3">💬</p>
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm mt-1">As mensagens do grupo aparecerão aqui</p>
            </div>
          ) : (
            groupedMessages.map(({ date, msgs }) => (
              <div key={date}>
                <div className="flex items-center gap-2 my-4">
                  <div className="flex-1 border-t border-zinc-800" />
                  <span className="text-xs text-zinc-600 px-2">{date}</span>
                  <div className="flex-1 border-t border-zinc-800" />
                </div>
                {msgs.map(msg => (
                  <div key={msg.id} className="group flex gap-3 mb-3 hover:bg-zinc-900/50 rounded-lg p-2 -mx-2 transition-colors">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-xs font-bold text-[#D4AF37] flex-shrink-0">
                      {getInitials(msg.from_name || '?')}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-sm font-semibold ${msg.is_bot ? 'text-[#D4AF37]' : 'text-zinc-200'}`}>
                          {msg.from_name}
                          {msg.is_bot && <span className="ml-1 text-xs font-normal text-[#D4AF37]/70">🤖</span>}
                        </span>
                        <span className="text-xs text-zinc-600">{formatTime(msg.date)}</span>
                      </div>
                      <p className="text-sm text-zinc-300 mt-0.5 break-words whitespace-pre-wrap">{msg.text || '(mídia)'}</p>
                    </div>
                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => handleCreateTask(msg)}
                        title="Criar task"
                        className="p-1.5 rounded bg-zinc-800 hover:bg-[#D4AF37]/20 text-zinc-400 hover:text-[#D4AF37] transition-colors text-xs"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-zinc-800">
          <div className="flex gap-3 items-end">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Enviar mensagem para ${selectedGroupInfo?.name}...`}
              rows={1}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 resize-none focus:outline-none focus:border-[#D4AF37]/50 transition-colors max-h-32"
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              className="px-4 py-3 bg-[#D4AF37] hover:bg-[#C9A227] disabled:bg-zinc-700 disabled:text-zinc-500 text-black font-semibold rounded-xl transition-colors text-sm flex-shrink-0"
            >
              {sending ? '...' : '▶'}
            </button>
          </div>
          <p className="text-xs text-zinc-700 mt-1.5">Enter para enviar · Shift+Enter para nova linha</p>
        </div>
      </div>
    </div>
  );
}
