import React from 'react';
import { 
  Card, 
  CardBody, 
  CardHeader,
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Chip,
  Spinner
} from '@nextui-org/react';

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'start' | 'center' | 'end';
}

export interface DataTableProps {
  title?: string;
  subtitle?: string;
  columns: DataTableColumn[];
  data: Array<Record<string, any>>;
  loading?: boolean;
  emptyContent?: string;
  headerActions?: React.ReactNode;
  className?: string;
  renderCell?: (item: Record<string, any>, columnKey: string) => React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  subtitle,
  columns,
  data,
  loading = false,
  emptyContent = 'No data available',
  headerActions,
  className = '',
  renderCell,
}) => {
  const defaultRenderCell = (item: Record<string, any>, columnKey: string) => {
    const value = item[columnKey];
    
    // Handle status fields with Chip component
    if (columnKey.toLowerCase().includes('status')) {
      const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'primary' | 'default'> = {
        'active': 'success',
        'completed': 'success',
        'paid': 'success',
        'settled': 'success',
        'pending': 'warning',
        'due': 'warning',
        'processing': 'primary',
        'overdue': 'danger',
        'failed': 'danger',
        'cancelled': 'danger',
      };
      
      const color = statusColors[value?.toLowerCase()] || 'default';
      
      return (
        <Chip
          color={color}
          size="sm"
          variant="flat"
        >
          {value}
        </Chip>
      );
    }
    
    // Handle currency formatting
    if (columnKey.toLowerCase().includes('amount') || columnKey.toLowerCase().includes('price')) {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(numValue);
      }
    }
    
    // Handle date formatting
    if (columnKey.toLowerCase().includes('date')) {
      if (value) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString();
        }
      }
    }
    
    return value?.toString() || '—';
  };

  const cellRenderer = renderCell || defaultRenderCell;

  const tableContent = (
    <Table 
      aria-label={title || 'Data table'} 
      removeWrapper
      classNames={{
        th: 'bg-content2 text-foreground-600 font-medium text-tiny uppercase tracking-wide',
        td: 'text-small',
      }}
    >
      <TableHeader>
        {columns.map((column) => (
          <TableColumn 
            key={column.key}
            align={column.align || 'start'}
            allowsSorting={column.sortable}
          >
            {column.label}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody 
        emptyContent={emptyContent}
        isLoading={loading}
        loadingContent={<Spinner />}
      >
        {data.map((item, index) => (
          <TableRow key={item.id || index}>
            {columns.map((column) => (
              <TableCell key={column.key}>
                {cellRenderer(item, column.key)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (title || subtitle || headerActions) {
    return (
      <Card className={`shadow-medium ${className}`}>
        {(title || subtitle || headerActions) && (
          <CardHeader className="pb-4 flex-row items-center justify-between">
            <div>
              {title && <h2 className="text-xl font-semibold text-foreground">{title}</h2>}
              {subtitle && <p className="text-small text-foreground-500">{subtitle}</p>}
            </div>
            {headerActions && <div>{headerActions}</div>}
          </CardHeader>
        )}
        <CardBody className="pt-0">
          {tableContent}
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={className}>
      {tableContent}
    </div>
  );
};