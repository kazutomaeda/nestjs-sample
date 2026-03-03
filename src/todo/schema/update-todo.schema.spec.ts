import { updateTodoSchema } from './update-todo.schema';

describe('updateTodoSchema', () => {
  describe('有効なケース', () => {
    it('タイトルのみで有効', () => {
      const input = { title: '更新タスク' };
      const result = updateTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('completedのみで有効', () => {
      const input = { completed: true };
      const result = updateTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('両方指定で有効', () => {
      const input = { title: '更新タスク', completed: true };
      const result = updateTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('空オブジェクトで有効（部分更新なので）', () => {
      const input = {};
      const result = updateTodoSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe('無効なケース', () => {
    it('タイトルが空文字の場合はエラー', () => {
      const input = { title: '' };
      const result = updateTodoSchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('タイトルは必須です');
      }
    });

    it('completedがbooleanでない場合はエラー', () => {
      const input = { completed: 'yes' };
      const result = updateTodoSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('タイトルが文字列でない場合はエラー', () => {
      const input = { title: 123 };
      const result = updateTodoSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });
});
