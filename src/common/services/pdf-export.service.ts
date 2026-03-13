import { Injectable, OnModuleInit } from '@nestjs/common';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { join } from 'node:path';
import { ExportColumn } from './csv-export.service';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfmake = require('pdfmake');

@Injectable()
export class PdfExportService implements OnModuleInit {
  onModuleInit(): void {
    pdfmake.setUrlAccessPolicy(() => true);

    const fontsDir = join(
      require.resolve('pdfmake/package.json'),
      '..',
      'build',
      'fonts',
      'Roboto',
    );
    pdfmake.setFonts({
      Roboto: {
        normal: join(fontsDir, 'Roboto-Regular.ttf'),
        bold: join(fontsDir, 'Roboto-Medium.ttf'),
        italics: join(fontsDir, 'Roboto-Italic.ttf'),
        bolditalics: join(fontsDir, 'Roboto-MediumItalic.ttf'),
      },
    });
  }

  async generate<T>(
    title: string,
    columns: ExportColumn<T>[],
    rows: T[],
  ): Promise<Buffer> {
    const headerRow = columns.map((c) => ({
      text: c.header,
      bold: true,
      fillColor: '#eeeeee',
    }));

    const bodyRows = rows.map((row) =>
      columns.map((col) => this.formatValue(col.accessor(row))),
    );

    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: title, style: 'title' },
        {
          table: {
            headerRows: 1,
            widths: columns.map(() => '*'),
            body: [headerRow, ...bodyRows],
          },
          layout: 'lightHorizontalLines',
        },
      ],
      styles: {
        title: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
      },
      defaultStyle: { fontSize: 10 },
    };

    return pdfmake.createPdf(docDefinition).getBuffer();
  }

  private formatValue(
    value: string | number | boolean | Date | null | undefined,
  ): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    return String(value);
  }
}
