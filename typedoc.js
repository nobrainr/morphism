module.exports = {
  name: 'Morphism API',
  out: './docs/typedoc',

  entryPoints: ["./src/morphism.ts"],
  // readme: 'none',
  exclude: ['/**/*.spec.ts'],

  externalPattern: '**/helpers.ts',
  excludeExternals: true,
  excludePrivate: true,
  excludeProtected: true,
};
