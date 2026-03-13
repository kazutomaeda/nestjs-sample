import { PdfExportService } from './pdf-export.service';
import { ExportColumn } from './csv-export.service';

describe('PdfExportService', () => {
  let service: PdfExportService;

  beforeEach(() => {
    service = new PdfExportService();
    service.onModuleInit();
  });

  interface TestRow {
    id: number;
    name: string;
  }

  const columns: ExportColumn<TestRow>[] = [
    { header: 'ID', accessor: (r) => r.id },
    { header: '名前', accessor: (r) => r.name },
  ];

  it('PDFバッファを生成する', async () => {
    const rows: TestRow[] = [{ id: 1, name: 'Test' }];
    const buffer = await service.generate('Test Report', columns, rows);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('空配列の場合もPDFを生成する', async () => {
    const buffer = await service.generate('Empty Report', columns, []);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
