// src/Store/chatStore.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// ============================================
// ТИПЫ
// ============================================
export interface ChatMessage {
    id:                 string
    sender:             string
    recipient:          string
    cargo:              string
    message:            string
    image?:             string
    timestamp:          string
    isRead:             boolean
}

export interface ChatItem {
    recipient:          string
    cargo:              string
    rec_name:           string
    cargo_name:         string
    last_message?:      string
    last_time?:         string
    unread_count?:      number
    messages?:          ChatMessage[]
    isLoading?:         boolean
    hasMore?:           boolean
}

// ============================================
// КОНСТАНТЫ
// ============================================
export const EMPTY_CHAT_ITEM: ChatItem = {
    recipient:          '',
    cargo:              '',
    rec_name:           '',
    cargo_name:         '',
    last_message:       '',
    last_time:          '',
    unread_count:       0,
    messages:           [],
    isLoading:          false,
    hasMore:            false
}

// ============================================
// ZUSTAND STORE
// ============================================
export interface ChatState {
  chats:            ChatItem[]
  isLoading:        boolean
  searchQuery:      string
  currentChat?: {
    recipient:      string
    cargo:          string
  }
}

interface ChatActions {
  setChats:                 ( chats: ChatItem[] ) => void
  setLoading:               ( loading: boolean ) => void
  setSearchQuery:           ( query: string ) => void
  setCurrentChat:           ( recipient: string, cargo: string ) => void
  clearCurrentChat:         ( ) => void
  ensureChat:               ( recipient: string, cargo: string, partial?: Partial<ChatItem> ) => void
  addMessage:               ( recipient: string, cargo: string, message: ChatMessage ) => void
  addMessages:              ( recipient: string, cargo: string, messages: ChatMessage[] ) => void
  setMessagesLoading:       ( recipient: string, cargo: string, loading: boolean ) => void
  setHasMore:               ( recipient: string, cargo: string, hasMore: boolean ) => void
  markAsRead:               ( recipient: string, cargo: string ) => void
  updateChatLastMessage:    ( recipient: string, cargo: string, message: string, timestamp: string ) => void
  reset:                    ( ) => void
}

type ChatStore = ChatState & ChatActions

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      // STATE
      chats: [],
      isLoading: false,
      searchQuery: '',
      currentChat: undefined,

      // ACTIONS
      setChats: (chats) => set({ chats }),
      setLoading: (isLoading) => set({ isLoading }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      
      setCurrentChat: (recipient, cargo) => 
        set({ currentChat: { recipient, cargo } }),
      
      clearCurrentChat: () => set({ currentChat: undefined }),

      ensureChat: (recipient, cargo, partial = {}) => {
        const { chats } = get()
        const exists = chats.some(
          (chat) => chat.recipient === recipient && chat.cargo === cargo
        )
        if (exists) return

        set({
          chats: [
            ...chats,
            {
              ...EMPTY_CHAT_ITEM,
              recipient,
              cargo,
              ...partial,
            },
          ],
        })
      },
      
      addMessage: (recipient, cargo, message) => {
        get().ensureChat(recipient, cargo)
        const { chats } = get()
        
        const updatedChats = chats.map(chat => {
          if (chat.recipient === recipient && chat.cargo === cargo) {
            return {
              ...chat,
              messages: [...(chat.messages || []), message]
            }
          }
          return chat
        })
        
        set({ chats: updatedChats })
      },
      
      addMessages: (recipient, cargo, messages) => {
        get().ensureChat(recipient, cargo)
        const { chats } = get();
        
        const updatedChats = chats.map(chat => {
          if (chat.recipient === recipient && chat.cargo === cargo) {
            // Получаем существующие ID сообщений для быстрой проверки
            const existingMessageIds = new Set(chat.messages?.map(msg => msg.id) || []);
            
            // Фильтруем новые сообщения, оставляем только те, которых еще нет в чате
            const uniqueNewMessages = messages.filter(msg => !existingMessageIds.has(msg.id));
            
            if (uniqueNewMessages.length > 0) {
              return {
                ...chat,
                messages: [...uniqueNewMessages, ...(chat.messages || [])]
              };
            }
          }
          return chat;
        });
        
        set({ chats: updatedChats });
      },
      
      setMessagesLoading: (recipient, cargo, loading) => {
        get().ensureChat(recipient, cargo)
        const { chats } = get()
        
        const updatedChats = chats.map(chat => {
          if (chat.recipient === recipient && chat.cargo === cargo) {
            return {
              ...chat,
              isLoading: loading
            }
          }
          return chat
        })
        
        set({ chats: updatedChats })
      },
      
      setHasMore: (recipient, cargo, hasMore) => {
        get().ensureChat(recipient, cargo)
        const { chats } = get()
        
        const updatedChats = chats.map(chat => {
          if (chat.recipient === recipient && chat.cargo === cargo) {
            return {
              ...chat,
              hasMore
            }
          }
          return chat
        })
        
        set({ chats: updatedChats })
      },
      
      markAsRead: ( recipient:string, cargo:string ) => {
        const { chats } = get()
        const updatedChats = chats.map(chat => 
          chat.recipient === recipient && chat.cargo === cargo 
            ? { ...chat, unread_count: 0 }
            : chat
        )
        
        set({ chats: updatedChats })
      },
      
      updateChatLastMessage: (recipient, cargo, message, timestamp) => {
        const { chats } = get()
        const updatedChats = chats.map(chat => 
          chat.recipient === recipient && chat.cargo === cargo 
            ? { ...chat, last_message: message, last_time: timestamp }
            : chat
        )
        
        set({ chats: updatedChats })
      },
      
      reset: () => set({
        chats: [],
        isLoading: false,
        searchQuery: '',
        currentChat: undefined
      })
    }),
    { name: 'chat-store' }
  )
)

// ============================================
// GETTERS
// ============================================
export const chatGetters = {
  getChats: (): ChatItem[] => useChatStore.getState().chats,
  
  getChat: (recipient: string, cargo: string): ChatItem | undefined =>
    useChatStore.getState().chats.find(chat => 
      chat.recipient === recipient && chat.cargo === cargo
    ),

  
  getUnreadCount: (): number => 
    useChatStore.getState().chats.reduce((total, chat) => total + (chat.unread_count || 0), 0),
  
  getFilteredChats: (searchQuery: string): ChatItem[] => {
    const chats = useChatStore.getState().chats
    if (!searchQuery.trim()) return chats
    
    return chats.filter(chat => 
      chat.rec_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.cargo_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }
}

// ============================================
// ACTIONS
// ============================================
export const chatActions = {
  setChats: (chats: ChatItem[]) => useChatStore.getState().setChats(chats),
  setLoading: (loading: boolean) => useChatStore.getState().setLoading(loading),
  setSearchQuery: (query: string) => useChatStore.getState().setSearchQuery(query),
  setCurrentChat: (recipient: string, cargo: string) => 
    useChatStore.getState().setCurrentChat(recipient, cargo),
  clearCurrentChat: () => useChatStore.getState().clearCurrentChat(),
  ensureChat: (recipient: string, cargo: string, partial?: Partial<ChatItem>) =>
    useChatStore.getState().ensureChat(recipient, cargo, partial),
  addMessage: (recipient: string, cargo: string, message: ChatMessage) => 
    useChatStore.getState().addMessage(recipient, cargo, message),
  addMessages: (recipient: string, cargo: string, messages: ChatMessage[]) => 
    useChatStore.getState().addMessages(recipient, cargo, messages),
  setMessagesLoading: (recipient: string, cargo: string, loading: boolean) => 
    useChatStore.getState().setMessagesLoading(recipient, cargo, loading),
  setHasMore: (recipient: string, cargo: string, hasMore: boolean) => 
    useChatStore.getState().setHasMore(recipient, cargo, hasMore),
  markAsRead: (recipient: string, cargo: string) => 
    useChatStore.getState().markAsRead(recipient, cargo),
  updateChatLastMessage: (recipient: string, cargo: string, message: string, timestamp: string) => 
    useChatStore.getState().updateChatLastMessage(recipient, cargo, message, timestamp),
  reset: () => useChatStore.getState().reset()
}

// ============================================
// SOCKET ОБРАБОТЧИКИ
// ============================================
export const chatSocketHandlers = {
  onGetChats: (response: any) => {
    
    chatActions.setLoading(false)
    
    if (response.success && Array.isArray(response.data)) {
      // Добавляем пустые массивы сообщений для каждого чата
      const chatsWithMessages = response.data.map(chat => ({
        ...chat,
        messages:   [],
        isLoading:  false,
        hasMore:    true
      }))
      chatActions.setChats(chatsWithMessages)
    } else {
      console.error('Invalid chats response:', response)
    }
  },

  onGetMessages: (response: any) => {
    
    if (response.success && response.data) {
      const { recipient, cargo, messages, hasMore } = response.data
      
      if (Array.isArray(messages)) {
        chatActions.addMessages(recipient, cargo, messages)
        chatActions.setHasMore(recipient, cargo, hasMore || false)
      }
      
      chatActions.setMessagesLoading(recipient, cargo, false)
    }
  },

  onNewMessage: (response: any) => {
    
    if (response.success && response.data) {
      const { message } = response.data
      chatActions.addMessage(message.recipient, message.cargo, message)
      chatActions.updateChatLastMessage(
        message.recipient, 
        message.cargo, 
        message.message, 
        message.timestamp
      )
    }
  },

  onMarkAsRead: (response: any) => {
    
    if (response.success && response.data) {
      const { recipient, cargo } = response.data
      chatActions.markAsRead(recipient, cargo)
    }
  }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ SOCKET ОБРАБОТЧИКОВ
// ============================================
export const initChatSocketHandlers = (socket: any) => {
  if (!socket) return

  // Снимаем прежние подписки, чтобы повторный init не дублировал обработчики (N× onGetMessages на один ответ)
  destroyChatSocketHandlers(socket)

  socket.on('get_chats',        chatSocketHandlers.onGetChats)
  socket.on('get_messages',     chatSocketHandlers.onGetMessages)
  socket.on('new_message',      chatSocketHandlers.onNewMessage)
  socket.on('mark_as_read',     chatSocketHandlers.onMarkAsRead)
  
}

export const destroyChatSocketHandlers = (socket: any) => {
  if (!socket) return
  
  socket.off('get_chats',       chatSocketHandlers.onGetChats)
  socket.off('get_messages',    chatSocketHandlers.onGetMessages)
  socket.off('new_message',     chatSocketHandlers.onNewMessage)
  socket.off('mark_as_read',    chatSocketHandlers.onMarkAsRead)
  
}