import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  // ==================== テナント ====================
  const tenantA = await prisma.tenant.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: 'テナントA' },
  });

  const tenantB = await prisma.tenant.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, name: 'テナントB' },
  });

  console.log(`  Tenants: ${tenantA.name}, ${tenantB.name}`);

  // ==================== ユーザー ====================
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const userPassword = await bcrypt.hash('User123!', 10);

  const systemAdmin = await prisma.user.upsert({
    where: { email: 'admin@system.example.com' },
    update: {},
    create: {
      tenantId: null,
      role: 'system_admin',
      email: 'admin@system.example.com',
      passwordHash: adminPassword,
      name: 'システム管理者',
    },
  });

  const tenantAAdmin = await prisma.user.upsert({
    where: { email: 'admin@tenant-a.example.com' },
    update: {},
    create: {
      tenantId: tenantA.id,
      role: 'tenant_admin',
      email: 'admin@tenant-a.example.com',
      passwordHash: adminPassword,
      name: 'テナントA管理者',
    },
  });

  const tenantAUser = await prisma.user.upsert({
    where: { email: 'user@tenant-a.example.com' },
    update: {},
    create: {
      tenantId: tenantA.id,
      role: 'tenant_user',
      email: 'user@tenant-a.example.com',
      passwordHash: userPassword,
      name: 'テナントAユーザー',
    },
  });

  const tenantBAdmin = await prisma.user.upsert({
    where: { email: 'admin@tenant-b.example.com' },
    update: {},
    create: {
      tenantId: tenantB.id,
      role: 'tenant_admin',
      email: 'admin@tenant-b.example.com',
      passwordHash: adminPassword,
      name: 'テナントB管理者',
    },
  });

  const tenantBUser = await prisma.user.upsert({
    where: { email: 'user@tenant-b.example.com' },
    update: {},
    create: {
      tenantId: tenantB.id,
      role: 'tenant_user',
      email: 'user@tenant-b.example.com',
      passwordHash: userPassword,
      name: 'テナントBユーザー',
    },
  });

  console.log(
    `  Users: ${systemAdmin.name}, ${tenantAAdmin.name}, ${tenantAUser.name}, ${tenantBAdmin.name}, ${tenantBUser.name}`,
  );

  // ==================== タグ ====================
  const tagWork = await prisma.tag.upsert({
    where: { tenantId_name: { tenantId: tenantA.id, name: '仕事' } },
    update: {},
    create: { tenantId: tenantA.id, name: '仕事' },
  });

  const tagPrivate = await prisma.tag.upsert({
    where: { tenantId_name: { tenantId: tenantA.id, name: 'プライベート' } },
    update: {},
    create: { tenantId: tenantA.id, name: 'プライベート' },
  });

  const tagDev = await prisma.tag.upsert({
    where: { tenantId_name: { tenantId: tenantB.id, name: '開発' } },
    update: {},
    create: { tenantId: tenantB.id, name: '開発' },
  });

  const tagOps = await prisma.tag.upsert({
    where: { tenantId_name: { tenantId: tenantB.id, name: '運用' } },
    update: {},
    create: { tenantId: tenantB.id, name: '運用' },
  });

  console.log(
    `  Tags: ${tagWork.name}, ${tagPrivate.name}, ${tagDev.name}, ${tagOps.name}`,
  );

  // ==================== TODO ====================
  const todo1 = await prisma.todo.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      tenantId: tenantA.id,
      title: 'テナントAのTODO-1',
      completed: false,
    },
  });

  const todo2 = await prisma.todo.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      tenantId: tenantA.id,
      title: 'テナントAのTODO-2',
      completed: true,
    },
  });

  const todo3 = await prisma.todo.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      tenantId: tenantB.id,
      title: 'テナントBのTODO-1',
      completed: false,
    },
  });

  console.log(
    `  Todos: ${todo1.title}, ${todo2.title}, ${todo3.title}`,
  );

  // ==================== TodoTag ====================
  // upsert が複合キーで使えないため、deleteMany + create で冪等化
  await prisma.todoTag.deleteMany({
    where: { todoId: { in: [todo1.id, todo3.id] } },
  });

  await prisma.todoTag.createMany({
    data: [
      { todoId: todo1.id, tagId: tagWork.id },
      { todoId: todo1.id, tagId: tagPrivate.id },
      { todoId: todo3.id, tagId: tagDev.id },
    ],
  });

  console.log('  TodoTags: created');

  console.log('✅ Seed completed');
  console.log('');
  console.log('📋 ログイン情報:');
  console.log('  system_admin  : admin@system.example.com   / Admin123!');
  console.log('  tenant_admin A: admin@tenant-a.example.com / Admin123!');
  console.log('  tenant_user A : user@tenant-a.example.com  / User123!');
  console.log('  tenant_admin B: admin@tenant-b.example.com / Admin123!');
  console.log('  tenant_user B : user@tenant-b.example.com  / User123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
