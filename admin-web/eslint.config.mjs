import nextConfig from 'eslint-config-next';

if (nextConfig[0]?.rules) {
  nextConfig[0].rules['react-hooks/set-state-in-effect'] = 'off';
}

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'node_modules/**',
      'tests/**',
    ],
  },
];

export default eslintConfig;
