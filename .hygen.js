module.exports = {
  helpers: {
    parseFields(fieldsStr) {
      if (!fieldsStr) return [];
      return fieldsStr
        .split(',')
        .filter((f) => f.trim())
        .map((f) => {
          const [name, type] = f.split(':').map((s) => s.trim());
          return { name, type: type || 'string' };
        });
    },
    tsType(type) {
      return (
        { string: 'string', number: 'number', boolean: 'boolean' }[type] ||
        'string'
      );
    },
    prismaType(type) {
      return (
        {
          string: 'String',
          number: 'Int',
          boolean: 'Boolean   @default(false)',
        }[type] || 'String'
      );
    },
    zodCreate(type) {
      return (
        {
          string: 'z.string().min(1)',
          number: 'z.coerce.number().int()',
          boolean: 'z.boolean().default(false)',
        }[type] || 'z.string()'
      );
    },
    zodUpdate(type) {
      return (
        {
          string: 'z.string().min(1).optional()',
          number: 'z.coerce.number().int().optional()',
          boolean: 'z.boolean().optional()',
        }[type] || 'z.string().optional()'
      );
    },
  },
};
