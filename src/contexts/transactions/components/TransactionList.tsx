import React, { useState, useMemo } from 'react';
import type { Transaction } from '../../../types';
import { useTransactionContext } from '../TransactionContext';
import { useCreditCards } from '../../../hooks';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { colors } from '../../../design-system';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: number) => void;
  isMonthClosed: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDelete,
  isMonthClosed
}) => {
  const { creditCards } = useCreditCards();
  const [expandedTransactions, setExpandedTransactions] = useState<Set<number>>(new Set());

  const COLORS = {
    Kaio: colors.person.kaio,
    Gabriela: colors.person.gabriela,
    Ambos: colors.person.ambos
  };

  // Agrupa transações por parentPurchase ou cria grupos para transações com parcelas
  const { groupedTransactions, allTransactions } = useMemo(() => {
    // Busca todas as transações (incluindo históricos de outros meses)
    // Por enquanto usa as transações passadas, mas idealmente deveria buscar todas do contexto
    const all = [...transactions];
    
    // Agrupa por parentPurchase - transações filhas (parcelas)
    const childrenMap = new Map<number, Transaction[]>();
    const parents: Transaction[] = [];
    
    all.forEach(trans => {
      if (trans.parentPurchase) {
        // É uma parcela de outra transação
        const siblings = childrenMap.get(trans.parentPurchase) || [];
        siblings.push(trans);
        childrenMap.set(trans.parentPurchase, siblings);
      } else if (trans.totalInstallments && trans.totalInstallments > 1) {
        // É uma transação pai (com parcelas)
        parents.push(trans);
      }
    });

    // Organiza: transações principais primeiro, depois suas parcelas
    const grouped: Array<{ main: Transaction; children: Transaction[] }> = [];
    const processedIds = new Set<number>();

    // Adiciona transações principais
    all.forEach(trans => {
      if (!processedIds.has(trans.id) && !trans.parentPurchase) {
        const children = childrenMap.get(trans.id) || [];
        grouped.push({ main: trans, children });
        processedIds.add(trans.id);
        children.forEach(child => processedIds.add(child.id));
      }
    });

    // Adiciona parcelas órfãs (que têm parentPurchase mas o pai não está na lista)
    all.forEach(trans => {
      if (!processedIds.has(trans.id) && trans.parentPurchase) {
        const parent = all.find(t => t.id === trans.parentPurchase);
        if (parent) {
          // Pai existe mas ainda não foi processado
          const existingGroup = grouped.find(g => g.main.id === parent.id);
          if (existingGroup) {
            existingGroup.children.push(trans);
          } else {
            grouped.push({ main: parent, children: [trans] });
          }
          processedIds.add(trans.id);
        } else {
          // Pai não existe na lista atual - mostra como órfão
          grouped.push({ main: trans, children: [] });
          processedIds.add(trans.id);
        }
      }
    });

    return { groupedTransactions: grouped, allTransactions: all };
  }, [transactions]);

  const toggleExpand = (transactionId: number) => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedTransactions(newExpanded);
  };

  const renderTransactionRow = (transaction: Transaction, isChild = false) => {
    const group = groupedTransactions.find(g => g.main.id === transaction.id);
    const hasChildren = group && group.children.length > 0;
    const isExpanded = expandedTransactions.has(transaction.id);
    const children = group?.children || [];

    return (
      <React.Fragment key={transaction.id}>
        <tr className={`hover:bg-gray-50 ${isChild ? 'bg-gray-50/50' : ''}`}>
          <td className="px-4 py-3 text-sm">
            <div className="flex items-center gap-2">
              {!isChild && hasChildren && (
                <button
                  onClick={() => toggleExpand(transaction.id)}
                  className="text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
              {isChild && <span className="text-gray-300">└</span>}
              {new Date(transaction.date).toLocaleDateString('pt-BR')}
            </div>
          </td>
          <td className="px-4 py-3 text-sm">
            <span className={`px-2 py-1 rounded text-xs ${
              transaction.type === 'Despesa' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {transaction.type}
            </span>
          </td>
          <td className="px-4 py-3 text-sm">
            <span 
              className="px-2 py-1 rounded text-xs" 
              style={{
                backgroundColor: `${COLORS[transaction.person]}20`, 
                color: COLORS[transaction.person]
              }}
            >
              {transaction.person}
            </span>
          </td>
          <td className="px-4 py-3 text-sm">{transaction.category}</td>
          <td className="px-4 py-3 text-sm">
            {isChild ? <span className="text-xs text-gray-400">↳</span> : null}
            {transaction.description}
          </td>
          <td className="px-4 py-3 text-sm">
            {transaction.paymentMethod === 'Crédito' && transaction.creditCard ? (
              <div className="flex flex-col">
                <span>{transaction.paymentMethod}</span>
                <span className="text-xs text-gray-500">
                  {creditCards.find(c => c.id === transaction.creditCard)?.name || 'Cartão'}
                </span>
              </div>
            ) : (
              transaction.paymentMethod
            )}
          </td>
          <td className="px-4 py-3 text-sm">
            {transaction.totalInstallments && transaction.totalInstallments > 1 ? (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                {transaction.installmentNumber}/{transaction.totalInstallments}x
              </span>
            ) : transaction.parentPurchase ? (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                Parcela
              </span>
            ) : (
              <span className="text-xs text-gray-400">À vista</span>
            )}
          </td>
          <td className="px-4 py-3 text-sm font-semibold">
            R$ {transaction.value.toFixed(2)}
          </td>
          <td className="px-4 py-3 text-sm">
            <button
              onClick={() => onDelete(transaction.id)}
              disabled={isMonthClosed}
              className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-red-50 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </td>
        </tr>
        {isExpanded && hasChildren && children.map(child => renderTransactionRow(child, true))}
      </React.Fragment>
    );
  };

  if (transactions.length === 0) {
    return (
      <p className="text-center py-8 text-gray-400">Nenhum lançamento encontrado</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Data</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pessoa</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categoria</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Descrição</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pagamento</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Parcelas</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Valor</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {groupedTransactions.map(({ main }) => renderTransactionRow(main))}
        </tbody>
      </table>
    </div>
  );
};
