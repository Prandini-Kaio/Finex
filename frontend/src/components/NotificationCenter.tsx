import { useMemo, useState } from 'react'
import { AlertCircle, X, Bell, CheckCircle2 } from 'lucide-react'
import { useFinance } from '../context/FinanceContext'
import { getAllNotifications, type Notification } from '../utils/notifications'

export const NotificationCenter: React.FC = () => {
  const { state } = useFinance()
  const [isOpen, setIsOpen] = useState(false)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const allNotifications = useMemo(() => {
    return getAllNotifications(
      state.creditCards,
      state.recurringTransactions,
      state.closedMonths,
      7 // 7 dias à frente
    )
  }, [state.creditCards, state.recurringTransactions, state.closedMonths])

  const activeNotifications = useMemo(() => {
    return allNotifications.filter((n) => !dismissed.has(n.id))
  }, [allNotifications, dismissed])

  const unreadCount = activeNotifications.length

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id))
  }

  const handleDismissAll = () => {
    setDismissed(new Set(activeNotifications.map((n) => n.id)))
  }

  if (unreadCount === 0 && !isOpen) {
    return null
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />
      case 'warning':
        return <AlertCircle className="text-orange-500" size={20} />
      case 'info':
        return <CheckCircle2 className="text-blue-500" size={20} />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'warning':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
      case 'info':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Botão de notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-white dark:bg-slate-800 rounded-full p-3 shadow-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        aria-label="Notificações"
      >
        <Bell size={24} className="text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel de notificações */}
      {isOpen && (
        <div className="absolute top-16 right-0 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 max-h-[600px] overflow-hidden flex flex-col">
          {/* Cabeçalho */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Bell size={20} />
              Notificações
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleDismissAll}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Limpar todas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lista de notificações */}
          <div className="overflow-y-auto flex-1">
            {activeNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                <p className="text-sm">Nenhuma notificação pendente</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-slate-700">
                {activeNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-l-4 ${getNotificationColor(notification.type)} hover:bg-opacity-80 transition-colors`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {notification.message}
                        </p>
                        {notification.daysUntil !== undefined && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {notification.daysUntil === 0
                              ? 'Vence hoje'
                              : notification.daysUntil === 1
                              ? 'Vence amanhã'
                              : `Vence em ${notification.daysUntil} dias`}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDismiss(notification.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="Dispensar notificação"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

