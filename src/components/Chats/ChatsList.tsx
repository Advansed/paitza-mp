import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { Search } from 'lucide-react'
import { useHistory } from 'react-router'
import styles from './ChatList.module.css'
import { useChats } from '../../Store/useChats'
import { useSocketStore } from '../../Store/socketStore'

const AVATAR_COLORS = ['#2b5adc', '#0f766e', '#c2410c', '#7c3aed', '#0369a1', '#be185d']

const getInitial = (name: string): string => {
  const letter = (name || '').trim().charAt(0)
  return letter ? letter.toUpperCase() : '?'
}

const avatarColor = (name: string): string => {
  let hash = 0
  for (let i = 0; i < (name || '').length; i += 1) hash += name.charCodeAt(i)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

const chatKey = (chat: { recipient: string; cargo: string }) =>
  `${chat.recipient}:${chat.cargo}`

const orderLabel = (cargo: string, cargoName?: string) => {
  const id = cargo ? `ЗК-${String(cargo).slice(0, 6).toUpperCase()}` : ''
  if (id && cargoName) return `${id} · ${cargoName}`
  return cargoName || id || i18n.t('order', { ns: 'chats' })
}

const ChatItem = React.memo(
  ({
    chat,
    active,
    onClick,
  }: {
    chat: any
    active: boolean
    onClick: () => void
  }) => {
    const { t } = useTranslation('chats')
    return (
    <button
      type="button"
      className={`${styles.chatCard} ${active ? styles.chatCardActive : ''}`}
      onClick={onClick}
    >
      <div className={styles.avatarWrap}>
        <div className={styles.avatar} style={{ background: avatarColor(chat.rec_name) }}>
          {getInitial(chat.rec_name)}
        </div>
        <span className={styles.onlineDot} aria-hidden />
      </div>
      <div className={styles.chatBody}>
        <div className={styles.chatTop}>
          <span className={styles.driverName}>{chat.rec_name || t('unnamed')}</span>
          {chat.last_time && (
            <span className={styles.timestamp}>{chat.last_time}</span>
          )}
        </div>
        <div className={styles.cargoName}>{orderLabel(chat.cargo, chat.cargo_name)}</div>
        <div className={styles.chatBottom}>
          <span className={styles.lastMessage}>
            {chat.last_message || t('noMessages')}
          </span>
          {chat.unread_count > 0 && (
            <span className={styles.unreadBadge}>{chat.unread_count}</span>
          )}
        </div>
      </div>
      </button>
    )
  }
)

type ChatsListProps = {
  activeId?: string
}

export function ChatsList({ activeId }: ChatsListProps) {
  const { t } = useTranslation('chats')
  const { filteredChats, isLoading, loadChats, setCurrentChat, searchQuery, setSearchQuery } = useChats()

  const history = useHistory()
  const isConnected = useSocketStore((state) => state.isConnected)

  const activeKey = useMemo(() => {
    if (!activeId) return ''
    const parts = activeId.split(':')
    if (parts.length < 2) return activeId
    return `${parts[0]}:${parts[1]}`
  }, [activeId])

  const handleChatClick = (chat: any) => {
    setCurrentChat(chat.recipient, chat.cargo)
    history.push(
      `/chats/${chat.recipient}:${chat.cargo}:${encodeURIComponent(chat.rec_name || '')}`
    )
  }

  useEffect(() => {
    if (isConnected) {
      loadChats()
    }
  }, [isConnected, loadChats])

  return (
    <div className={styles.pageRoot}>
      <div className={styles.listHead}>
        <h2 className={styles.listTitle}>{t('messages')}</h2>
        <label className={styles.searchWrap}>
          <Search size={16} strokeWidth={2} className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>
      <div className={styles.pageContent}>
        {isLoading ? (
          <div className={styles.skeleton}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeletonItem} />
            ))}
          </div>
        ) : (
          <div className={styles.chatList}>
            {filteredChats.map((chat) => (
              <ChatItem
                key={chatKey(chat)}
                chat={chat}
                active={activeKey === chatKey(chat)}
                onClick={() => handleChatClick(chat)}
              />
            ))}

            {filteredChats.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>💬</div>
                <div>{searchQuery ? t('nothing') : t('empty')}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
