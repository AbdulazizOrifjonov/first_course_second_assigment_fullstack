import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Edit3, FileAudio, Image, MessageCircle, Paperclip, PlaySquare, Reply, Save, Send, Trash2, X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext/AuthContext';
import { useToast } from '../../../context/ToastContext/ToastContext';
import { RoleBadge } from '../../ui/Badge/Badge';
import './ChatPage.css';

/**
 * @typedef {Object} ChatMessage
 * @property {string} id
 * @property {string} userId
 * @property {string} fullName
 * @property {string} role
 * @property {string} text
 * @property {Array} attachments
 * @property {Object|null} replyTo
 * @property {Record<string, string[]>} reactions
 * @property {string[]} seenBy
 * @property {string} createdAt
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} Attachment
 * @property {string} id
 * @property {'image'|'video'|'audio'} type
 * @property {string} name
 * @property {string} dataUrl
 */

const STORAGE_KEY = 'tybt_team_chat';

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  window.dispatchEvent(new Event('tybt-chat-updated'));
}

function getAttachmentType(file) {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return null;
}

function fileToAttachment(file) {
  return new Promise((resolve, reject) => {
    const type = getAttachmentType(file);
    if (!type) {
      reject(new Error('Faqat rasm, video yoki audio fayl yuklang'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        id: crypto.randomUUID(),
        type,
        name: file.name,
        dataUrl: String(reader.result),
      });
    };
    reader.onerror = () => reject(new Error('Faylni o\'qib bo\'lmadi'));
    reader.readAsDataURL(file);
  });
}

function roleLabel(role) {
  if (role === 'admin') return 'Admin';
  if (role === 'clinician') return 'Shifokor';
  if (role === 'receptionist') return 'Qabul';
  return role;
}

export function ChatPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [messages, setMessages] = useState(() => loadMessages());
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const sync = () => setMessages(loadMessages());
    window.addEventListener('storage', sync);
    window.addEventListener('tybt-chat-updated', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('tybt-chat-updated', sync);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    const input = messageInputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    const lineHeight = 20;
    const maxHeight = lineHeight * 5 + 24;
    input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
    input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [text]);

  useEffect(() => {
    if (!user) return;
    const nextMessages = messages.map(message => {
      if (message.userId === user.id || message.seenBy?.includes(user.fullName)) return message;
      return { ...message, seenBy: [...(message.seenBy || []), user.fullName] };
    });
    if (JSON.stringify(nextMessages) !== JSON.stringify(messages)) {
      setMessages(nextMessages);
      saveMessages(nextMessages);
    }
  }, [messages, user]);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages]);

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (files.length === 0) return;

    try {
      const nextAttachments = await Promise.all(files.map(fileToAttachment));
      setAttachments(prev => [...prev, ...nextAttachments].slice(0, 6));
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Fayl qo\'shilmadi',
        message: err instanceof Error ? err.message : 'Faylni yuklashda xato.',
      });
    }
  };

  const handleSend = (event) => {
    event.preventDefault();
    if (!user) return;
    if (!text.trim() && attachments.length === 0) return;

    const nextMessage = {
      id: crypto.randomUUID(),
      userId: user.id,
      fullName: user.fullName,
      role: user.role,
      text: text.trim(),
      attachments,
      replyTo: replyTo ? {
        id: replyTo.id,
        fullName: replyTo.fullName,
        text: replyTo.text || `${replyTo.attachments.length} ta fayl`,
      } : undefined,
      reactions: {},
      seenBy: [],
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, nextMessage];
    setMessages(nextMessages);
    saveMessages(nextMessages);
    setText('');
    setAttachments([]);
    setReplyTo(null);
    showToast({
      type: 'success',
      title: 'Xabar yuborildi',
      message: 'Chatga yangi xabar qo\'shildi.',
    });
  };

const startEdit = (message) => {  
    setEditingId(message.id);
    setEditingText(message.text);
  };

  const startReply = (message) => {
    setReplyTo(message);
    window.setTimeout(() => messageInputRef.current?.focus(), 0);
  };

  const saveEdit = (messageId) => {
    const nextMessages = messages.map(message =>
      message.id === messageId
        ? { ...message, text: editingText.trim(), updatedAt: new Date().toISOString() }
        : message
    );
    setMessages(nextMessages);
    saveMessages(nextMessages);
    setEditingId(null);
    setEditingText('');
    showToast({ type: 'success', title: 'Xabar tahrirlandi' });
  };

  const deleteMessage = (messageId) => {
    const nextMessages = messages.filter(message => message.id !== messageId);
    setMessages(nextMessages);
    saveMessages(nextMessages);
    showToast({ type: 'success', title: 'Xabar o\'chirildi' });
  };

  const toggleReaction = (messageId, emoji) => {
    if (!user) return;
    const nextMessages = messages.map(message => {
      if (message.id !== messageId) return message;
      const reactions = { ...(message.reactions || {}) };
      const users = reactions[emoji] || [];
      reactions[emoji] = users.includes(user.fullName)
        ? users.filter(name => name !== user.fullName)
        : [...users, user.fullName];
      if (reactions[emoji].length === 0) delete reactions[emoji];
      return { ...message, reactions };
    });
    setMessages(nextMessages);
    saveMessages(nextMessages);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <MessageCircle size={20} className="text-green-600" />
              Jamoa Chati
            </h2>
            <p className="text-sm text-gray-500">Admin, shifokor va qabul xodimlari o'zaro yozishadi.</p>
          </div>
          <div className="text-xs text-gray-500">
            {messages.length} ta xabar
          </div>
        </div>
      </div>

      <div className="min-h-[62vh] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex min-h-[62vh] flex-col">
          <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
            {sortedMessages.length === 0 ? (
              <div className="flex h-full min-h-60 items-center justify-center text-center">
                <div>
                  <MessageCircle size={44} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-semibold text-gray-700">Hali xabar yo'q</p>
                  <p className="text-sm text-gray-400">Matn, rasm, video yoki audio yuboring.</p>
                </div>
              </div>
            ) : (
              sortedMessages.map(message => {
                const mine = message.userId === user?.id;
                return (
                  <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-2xl rounded-2xl border p-3 ${mine ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-700 text-sm font-bold text-white">
                            {message.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 break-safe">{message.fullName}</p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2">
                              <RoleBadge role={message.role} />
                              <span className="text-[11px] text-gray-400">{roleLabel(message.role)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-1">
                          <button
                            onClick={() => startReply(message)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-green-600"
                            title="Javob yozish"
                          >
                            <Reply size={15} />
                          </button>
                          <button
                            onClick={() => startEdit(message)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-blue-600"
                            title="Tahrirlash"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => deleteMessage(message.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-red-600"
                            title="O'chirish"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {editingId === message.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingText}
                            onChange={event => setEditingText(event.target.value)}
                            rows={3}
                            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-white"
                            >
                              Bekor
                            </button>
                            <button
                              onClick={() => saveEdit(message.id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                            >
                              <Save size={15} />
                              Saqlash
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {message.replyTo && (
                            <div className="mb-2 rounded-xl border-l-4 border-green-500 bg-white/70 px-3 py-2">
                              <p className="text-xs font-bold text-green-700">{message.replyTo.fullName}</p>
                              <p className="line-clamp-2 text-xs text-gray-500 break-safe">{message.replyTo.text}</p>
                            </div>
                          )}
                          {message.text && <p className="whitespace-pre-wrap text-sm text-gray-800 break-safe">{message.text}</p>}
                        </>
                      )}

                      {message.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.attachments.map(attachment => (
                            <div key={attachment.id} className="overflow-hidden rounded-2xl border border-white/80 bg-white">
                              {attachment.type === 'image' && (
                                <img src={attachment.dataUrl} alt={attachment.name} className="h-44 w-44 rounded-2xl object-cover" />
                              )}
                              {attachment.type === 'video' && (
                                <video src={attachment.dataUrl} controls className="h-44 w-44 rounded-full bg-black object-cover" />
                              )}
                              {attachment.type === 'audio' && (
                                <div className="w-64 max-w-full p-3">
                                  <audio src={attachment.dataUrl} controls className="w-full" />
                                </div>
                              )}
                              <p className="max-w-44 truncate px-3 py-2 text-xs text-gray-500">{attachment.name}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {['👍', '❤️', '😂', '😮', '👏'].map(emoji => {
                          const count = message.reactions?.[emoji]?.length || 0;
                          return (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(message.id, emoji)}
                              className={`rounded-full px-2 py-1 text-xs transition ${count ? 'bg-white shadow-sm' : 'hover:bg-white/70'}`}
                              title={count ? message.reactions?.[emoji]?.join(', ') : 'Emoji qo\'yish'}
                            >
                              {emoji}{count > 0 && <span className="ml-1 font-semibold">{count}</span>}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                        <span>
                          {new Date(message.createdAt).toLocaleString('uz-UZ')}
                          {message.updatedAt && ' · tahrirlangan'}
                        </span>
                        <span title={(message.seenBy || []).join(', ')}>
                          Ko'rganlar: {(message.seenBy || []).length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-gray-100 p-3 sm:p-4">
            {replyTo && (
              <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border-l-4 border-green-500 bg-green-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-green-700">Javob: {replyTo.fullName}</p>
                  <p className="line-clamp-1 text-sm text-gray-600 break-safe">{replyTo.text || `${replyTo.attachments.length} ta fayl`}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-white hover:text-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map(attachment => (
                  <div key={attachment.id} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    {attachment.type === 'image' && <Image size={14} />}
                    {attachment.type === 'video' && <PlaySquare size={14} />}
                    {attachment.type === 'audio' && <FileAudio size={14} />}
                    <span className="max-w-36 truncate">{attachment.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter(item => item.id !== attachment.id))}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                <Paperclip size={17} />
                Fayl
              </button>
              <textarea
                ref={messageInputRef}
                value={text}
                onChange={event => setText(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={1}
                placeholder="Xabar yozing..."
                className="max-h-[124px] min-h-12 flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-5 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700"
              >
                <Send size={17} />
                Yuborish
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
