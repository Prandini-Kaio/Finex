import React from 'react';
import { Button } from './Button';
import { MonthSelector } from './MonthSelector';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
  monthSelector?: {
    value: string;
    onChange: (value: string) => void;
  };
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAddClick?: () => void;
  addButtonIcon?: LucideIcon;
  addButtonVariant?: 'primary' | 'success' | 'warning' | 'error' | 'secondary';
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  actions,
  monthSelector,
  showAddButton = false,
  addButtonLabel = 'Adicionar',
  onAddClick,
  addButtonIcon: AddButtonIcon,
  addButtonVariant = 'primary',
}) => {
  return (
    <div className="flex justify-between items-center flex-wrap gap-4">
      <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      <div className="flex gap-4 items-center flex-wrap">
        {monthSelector && (
          <MonthSelector
            value={monthSelector.value}
            onChange={monthSelector.onChange}
          />
        )}
        {showAddButton && onAddClick && (
          <Button
            variant={addButtonVariant}
            icon={AddButtonIcon}
            onClick={onAddClick}
          >
            {addButtonLabel}
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
};

