import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'OXI ONE MKII Manual Documentation',
  tagline: 'Development documentation for OXI ONE MKII manual viewer',
  // favicon: 'img/favicon.ico', // TODO: Add favicon later

  // Set the production url of your site here
  url: 'https://your-docusaurus-site.example.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/doc/',

  // Don't add trailing slash
  trailingSlash: false,

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang.
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja'],
  },

  // Add noindex meta tag to prevent search engine indexing
  noIndex: true,

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          // Disable edit links since this is private documentation
          editUrl: undefined,
          // Show last update time and author from git history
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
          // Add remark plugin to inject creation dates
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          beforeDefaultRemarkPlugins: [[require('./plugins/remark-creation-date.js'), {}]],
        },
        // Disable blog feature
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        language: ['ja'],
        hashed: true,
        highlightSearchTermsOnTargetPage: true,
        docsRouteBasePath: '/',
        // Disable indexing for search engines
        indexDocs: true,
        indexBlog: false,
        indexPages: true,
      },
    ],
  ],

  themeConfig: {
    // Force dark mode and disable theme switching
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    // Add meta tags for SEO protection
    metadata: [
      { name: 'robots', content: 'noindex, nofollow' },
      { name: 'googlebot', content: 'noindex, nofollow' },
    ],
    navbar: {
      title: 'OXI ONE MKII Manual Docs',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'inboxSidebar',
          position: 'left',
          label: 'INBOX',
          docsPluginId: 'default',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} OXI ONE MKII Manual Project. Documentation built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.oneDark,
    },
    // Code block settings
    codeblock: {
      showLineNumbers: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
