'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Conversation {
  id: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  productPrice: number;
  otherUser: {
    name: string;
    avatar?: string;
  };
  lastMessage: {
    content: string;
    timestamp: Date;
    isFromMe: boolean;
  };
  unreadCount: number;
  status: 'ativa' | 'arquivada';
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isFromMe: boolean;
  type: 'text' | 'image' | 'offer';
  offerAmount?: number;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      // TODO: Implementar API para buscar conversas do usuário
      // Simulando dados por enquanto
      const mockConversations: Conversation[] = [
        {
          id: '1',
          productId: '1',
          productTitle: 'Poltrona Vintage Anos 70',
          productPrice: 450.00,
          otherUser: {
            name: 'Maria Silva',
          },
          lastMessage: {
            content: 'Posso ir ver a poltrona amanhã?',
            timestamp: new Date('2024-01-22T14:30:00'),
            isFromMe: false
          },
          unreadCount: 2,
          status: 'ativa'
        },
        {
          id: '2',
          productId: '2',
          productTitle: 'Mesa de Centro Retrô',
          productPrice: 280.00,
          otherUser: {
            name: 'João Santos',
          },
          lastMessage: {
            content: 'Obrigado! Vou pensar e te respondo.',
            timestamp: new Date('2024-01-21T16:45:00'),
            isFromMe: false
          },
          unreadCount: 0,
          status: 'ativa'
        },
        {
          id: '3',
          productId: '3',
          productTitle: 'Vinil Miles Davis',
          productPrice: 450.00,
          otherUser: {
            name: 'Ana Costa',
          },
          lastMessage: {
            content: 'Aceita R$ 400?',
            timestamp: new Date('2024-01-20T10:15:00'),
            isFromMe: false
          },
          unreadCount: 1,
          status: 'ativa'
        }
      ];
      
      setConversations(mockConversations);
      if (mockConversations.length > 0) {
        setSelectedConversation(mockConversations[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      // TODO: Implementar API para buscar mensagens da conversa
      // Por enquanto, usando dados mock baseados no conversationId
      console.log('Carregando mensagens para conversa:', conversationId);
      
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Olá! Tenho interesse na poltrona. Ela ainda está disponível?',
          timestamp: new Date('2024-01-22T10:00:00'),
          isFromMe: false,
          type: 'text'
        },
        {
          id: '2',
          content: 'Oi! Sim, ainda está disponível. Você gostaria de vê-la pessoalmente?',
          timestamp: new Date('2024-01-22T10:15:00'),
          isFromMe: true,
          type: 'text'
        },
        {
          id: '3',
          content: 'Perfeito! Aceita R$ 400?',
          timestamp: new Date('2024-01-22T10:30:00'),
          isFromMe: false,
          type: 'offer',
          offerAmount: 400
        },
        {
          id: '4',
          content: 'O preço está bem justo, mas podemos conversar pessoalmente. Que tal nos encontrarmos?',
          timestamp: new Date('2024-01-22T11:00:00'),
          isFromMe: true,
          type: 'text'
        },
        {
          id: '5',
          content: 'Posso ir ver a poltrona amanhã?',
          timestamp: new Date('2024-01-22T14:30:00'),
          isFromMe: false,
          type: 'text'
        }
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
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

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      timestamp: new Date(),
      isFromMe: true,
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    
    // TODO: Implementar envio via API
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
                            {conversation.otherUser.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-vintage-subtitle text-sm text-[#3C3C3C] truncate">
                              {conversation.otherUser.name}
                            </h4>
                            <span className="text-xs text-[#6B4C57] font-vintage-body">
                              {formatDate(conversation.lastMessage.timestamp)}
                            </span>
                          </div>
                          
                          <p className="text-xs text-[#6B4C57] font-vintage-body mb-1 truncate">
                            {conversation.productTitle}
                          </p>
                          
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-[#6B4C57] font-vintage-body truncate">
                              {conversation.lastMessage.content}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-[#D4AF37] text-[#3C3C3C] text-xs px-2 py-1 rounded-full font-vintage-body font-medium ml-2">
                                {conversation.unreadCount}
                              </span>
                            )}
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
                              {currentConversation.otherUser.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-vintage-subtitle text-[#3C3C3C]">
                              {currentConversation.otherUser.name}
                            </h3>
                            <p className="text-sm text-[#6B4C57] font-vintage-body">
                              {currentConversation.productTitle} - R$ {currentConversation.productPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        
                        <Link
                          href={`/products/${currentConversation.productId}`}
                          className="text-sm vintage-button px-3 py-1"
                        >
                          Ver Produto
                        </Link>
                      </div>
                    </div>

                    {/* Mensagens */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.isFromMe
                                ? 'bg-[#8B6F47] text-white'
                                : 'bg-[#E8DCC6] text-[#3C3C3C]'
                            }`}
                          >
                            {message.type === 'offer' ? (
                              <div>
                                <div className="text-sm font-vintage-subtitle mb-1">
                                  💰 Oferta: R$ {message.offerAmount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                              message.isFromMe ? 'text-[#E8DCC6]' : 'text-[#6B4C57]'
                            }`}>
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
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