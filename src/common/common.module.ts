import { Module } from '@nestjs/common';
import { CsvExportService } from './services/csv-export.service';
import { PdfExportService } from './services/pdf-export.service';

@Module({
  providers: [CsvExportService, PdfExportService],
  exports: [CsvExportService, PdfExportService],
})
export class CommonModule {}
