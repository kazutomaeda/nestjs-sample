import { Injectable } from '@nestjs/common';

export type ExportColumn<T> = {
  header: string;
  accessor: (row: T) => string | number | boolean | Date | null | undefined;
};

const BOM = '\uFEFF';

@Injectable()
export class CsvExportService {
  generate<T>(columns: ExportColumn<T>[], rows: T[]): Buffer {
    const header = columns.map((c) => this.escapeField(c.header)).join(',');
    const body = rows.map((row) =>
      columns
        .map((col) => this.escapeField(this.formatValue(col.accessor(row))))
        .join(','),
    );
    const csv = BOM + [header, ...body].join('\r\n') + '\r\n';
    return Buffer.from(csv, 'utf-8');
  }

  private formatValue(
    value: string | number | boolean | Date | null | undefined,
  ): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    return String(value);
  }

  private escapeField(value: string): string {
    if (
      value.includes(',') ||
      value.includes('"') ||
      value.includes('\n') ||
      value.includes('\r')
    ) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
