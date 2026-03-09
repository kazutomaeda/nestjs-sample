import { createTodoSchema } from './create-todo.schema';

describe('createTodoSchema', () => {
  describe('有効なケース', () => {
    it('タイトルのみで有効', () => {
      const input = { title: 'タスク1' };
      const result = createTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ title: 'タスク1' });
      }
    });

    it('タグ付きで有効', () => {
      const input = { title: 'タスク1', tags: ['重要', '買い物'] };
      const result = createTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          title: 'タスク1',
          tags: ['重要', '買い物'],
        });
      }
    });

    it('余分なフィールドは除去される', () => {
      const input = { title: 'タスク1', extra: 'field' };
      const result = createTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ title: 'タスク1' });
      }
    });
  });

  describe('無効なケース', () => {
    it('タイトルが空文字の場合はエラー', () => {
      const input = { title: '' };
      const result = createTodoSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('タイトルは必須です');
      }
    });

    it('タイトルがない場合はエラー', () => {
      const input = {};
      const result = createTodoSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('タイトルが文字列でない場合はエラー', () => {
      const input = { title: 123 };
      const result = createTodoSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('タグに空文字が含まれる場合はエラー', () => {
      const input = { title: 'タスク1', tags: [''] };
      const result = createTodoSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('タグが文字列配列でない場合はエラー', () => {
      const input = { title: 'タスク1', tags: [123] };
      const result = createTodoSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
