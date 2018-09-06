module.exports = {
  name: 'Morphism API',
  out: './docs/typedoc',

  // readme: 'none',
  exclude: ['/**/*.spec.ts'],

  mode: 'modules',

  excludeExternals: true,
  excludeNotExported: true,
  excludePrivate: true,
  excludeProtected: true,
  includeDeclarations: true
};
