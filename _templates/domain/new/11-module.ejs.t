---
to: src/<%= name %>/<%= name %>.module.ts
---
<%
const pascal = h.changeCase.pascal(name)
-%>
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { Admin<%= pascal %>Controller } from './admin-<%= name %>.controller';
import { <%= pascal %>Controller } from './<%= name %>.controller';
import { <%= pascal %>Repository } from './<%= name %>.repository';
import { Admin<%= pascal %>Usecase } from './admin-<%= name %>.usecase';
import { <%= pascal %>Usecase } from './<%= name %>.usecase';
import { <%= pascal %>Validator } from './<%= name %>.validator';

@Module({
  imports: [AuthModule, AuditLogModule],
  controllers: [Admin<%= pascal %>Controller, <%= pascal %>Controller],
  providers: [Admin<%= pascal %>Usecase, <%= pascal %>Usecase, <%= pascal %>Validator, <%= pascal %>Repository],
  // exports は external/ 配下のもののみ
})
export class <%= pascal %>Module {}
