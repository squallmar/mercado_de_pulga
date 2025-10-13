'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Conversation {
  id: string;
  product_id: string;
  product_title: string;
  product_image?: string;
  product_price: number;
  other_user_name: string;
  other_user_id: string;
  last_message?: string;
  last_message_time?: string;
  last_message_sender_id?: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  type?: 'text' | 'image' | 'offer';
  offer_amount?: number;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const isMyMessage = (message: Message) => {
    return session?.user?.id === message.sender_id;
  };

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar conversas');
      }
      
      const data = await response.json();
      setConversations(data.conversations || []);
      
      if (data.conversations && data.conversations.length > 0) {
        setSelectedConversation(data.conversations[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/messages?conversation_id=${conversationId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar mensagens');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    fetchConversations();
  }, [session, status, router, fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation, fetchMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !session?.user?.id) return;

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConversation,
      sender_id: session.user.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      type: 'text'
    };

    // Atualização otimista
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: selectedConversation,
          content: newMessage
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      // Recarregar mensagens para pegar a mensagem real do servidor
      await fetchMessages(selectedConversation);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Remover mensagem otimista em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      setNewMessage(newMessage); // Restaurar o texto
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return formatTime(date);
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      }).format(date);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="vintage-card p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-[#8B6F47] border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 font-vintage-body text-[#6B4C57]">Carregando mensagens...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1E8] to-[#E8DCC6] p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-vintage-title text-3xl mb-2" style={{ color: '#3C3C3C' }}>
            Mensagens
          </h1>
          <p className="font-vintage-body text-[#6B4C57]">
            Converse com compradores e vendedores
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="vintage-card p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="font-vintage-subtitle text-xl mb-2" style={{ color: '#6B4C57' }}>
              Nenhuma conversa ainda
            </h2>
            <p className="font-vintage-body text-[#6B4C57] mb-6">
              Quando você entrar em contato com vendedores ou receber mensagens sobre seus produtos, elas aparecerão aqui.
            </p>
            <Link href="/products" className="vintage-button">
              Explorar Produtos
            </Link>
          </div>
        ) : (
          <div className="vintage-card overflow-hidden">
            <div className="flex h-[600px]">
              {/* Lista de conversas */}
              <div className="w-1/3 border-r border-[#E8DCC6] flex flex-col">
                <div className="p-4 border-b border-[#E8DCC6]">
                  <h3 className="font-vintage-subtitle text-lg" style={{ color: '#6B4C57' }}>
                    Conversas ({conversations.length})
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`p-4 border-b border-[#E8DCC6] cursor-pointer hover:bg-[#E8DCC6] transition-colors ${
                        selectedConversation === conversation.id ? 'bg-[#E8DCC6]' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #8B6F47, #B4735C)' }}>
                          <span className="text-white font-vintage-subtitle text-sm">
                            {conversation.other_user_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-vintage-subtitle text-sm text-[#3C3C3C] truncate">
                              {conversation.other_user_name}
                            </h4>
                            <span className="text-xs text-[#6B4C57] font-vintage-body">
                              {conversation.last_message_time ? formatDate(new Date(conversation.last_message_time)) : formatDate(new Date(conversation.created_at))}
                            </span>
                          </div>
                          
                          <p className="text-xs text-[#6B4C57] font-vintage-body mb-1 truncate">
                            {conversation.product_title}
                          </p>
                          
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-[#6B4C57] font-vintage-body truncate">
                              {conversation.last_message || 'Nova conversa'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 flex flex-col">
                {currentConversation ? (
                  <>
                    {/* Header do chat */}
                    <div className="p-4 border-b border-[#E8DCC6] bg-[#F5F1E8]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #8B6F47, #B4735C)' }}>
                            <span className="text-white font-vintage-subtitle">
                              {currentConversation.other_user_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-vintage-subtitle text-[#3C3C3C]">
                              {currentConversation.other_user_name}
                            </h3>
                            <p className="text-sm text-[#6B4C57] font-vintage-body">
                              {currentConversation.product_title} - R$ {currentConversation.product_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        
                        <Link
                          href={`/products/${currentConversation.product_id}`}
                          className="text-sm vintage-button px-3 py-1"
                        >
                          Ver Produto
                        </Link>
                      </div>
                    </div>

                    {/* Mensagens */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => {
                        const isFromMe = isMyMessage(message);
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                isFromMe
                                  ? 'bg-[#8B6F47] text-white'
                                  : 'bg-[#E8DCC6] text-[#3C3C3C]'
                              }`}
                            >
                              {message.type === 'offer' ? (
                                <div>
                                  <div className="text-sm font-vintage-subtitle mb-1">
                                    💰 Oferta: R$ {message.offer_amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </div>
                                  <div className="text-sm font-vintage-body">
                                    {message.content}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm font-vintage-body">
                                  {message.content}
                                </div>
                              )}
                              <div className={`text-xs mt-1 ${
                                isFromMe ? 'text-[#E8DCC6]' : 'text-[#6B4C57]'
                              }`}>
                                {formatTime(new Date(message.created_at))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Input de nova mensagem */}
                    <div className="p-4 border-t border-[#E8DCC6] bg-[#F5F1E8]">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Digite sua mensagem..."
                          className="flex-1 vintage-input"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                          className="vintage-button px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Enviar
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-4">💬</div>
                      <p className="font-vintage-body text-[#6B4C57]">
                        Selecione uma conversa para começar
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}