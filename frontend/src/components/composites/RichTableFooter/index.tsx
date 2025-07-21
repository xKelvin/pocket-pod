import { Button } from '@/components/ui/button';
import { Table } from '@tanstack/react-table';

export default function RichTableFooter<TData>({
  table,
  counterWord = '件',
  stepSize = [10, 20, 30, 40, 50],
}: {
  table: Table<TData>;
  counterWord?: string;
  stepSize?: number[];
}) {
  return (
    <div className="flex flex-col items-center justify-between py-4 md:flex-row">
      <div className="order-2 flex items-center space-x-2 md:order-1">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredRowModel().rows.length} {counterWord}
        </div>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
        >
          {stepSize.map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </select>
      </div>
      <div className="order-1 flex items-center space-x-2 md:order-2">
        <Button variant="outline" size="sm" onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>
          最初へ
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          前へ
        </Button>
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </div>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          次へ
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>
          最後へ
        </Button>
      </div>
    </div>
  );
}
