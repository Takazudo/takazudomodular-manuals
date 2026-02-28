import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Takazudo Modular: Manuals',
  tagline: 'Development documentation for manual viewer',
  // favicon: 'img/favicon.ico', // TODO: Add favicon later

  // Set the production url of your site here
  url: 'https://manual-oxi-one-mk2.netlify.app',
  // Set the /<baseUrl>/ pathname under which your site is served
  // Must include /manuals/ prefix because the whole site is served under basePath /manuals/
  baseUrl: '/manuals/doc/',

  // Don't add trailing slash
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',
  onDuplicateRoutes: 'warn',

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

  // Load Noto Sans JP font from Google Fonts
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap',
      },
    },
  ],

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
    // Suppress known webpack warnings from search plugin
    function suppressSearchPluginWarnings() {
      return {
        name: 'suppress-search-plugin-warnings',
        configureWebpack() {
          return {
            ignoreWarnings: [
              // Suppress warnings from @easyops-cn/docusaurus-search-local
              (warning) => {
                return (
                  warning.message &&
                  warning.message.includes('proxiedGenerated') &&
                  warning.message.includes('module has no exports')
                );
              },
            ],
          };
        },
      };
    },
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
      title: 'Takazudo Modular: Manuals Docs',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'inboxSidebar',
          position: 'left',
          label: 'INBOX',
          docsPluginId: 'default',
        },
        {
          type: 'html',
          position: 'right',
          value:
            '<a href="https://takazudomodular.com/" class="navbar__takazudo-modular" rel="noopener noreferrer"><img src="/manuals/doc/img/logo.svg" alt="" /><span>Takazudo Modular</span></a>',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Takazudo Modular. Documentation built with Docusaurus.`,
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
