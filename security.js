(function() {
  'use strict';

  const allowedHosts = new Set([
    'wangjingbo1219.github.io',
    'www.linkedin.com',
    'scholar.google.com',
    'arxiv.org',
    'bfm4humanoid.github.io',
    'taohuang13.github.io',
    'github.com',
    'yinkangning0124.github.io',
    'zhutengjie.github.io',
    'wyhuai.github.io',
    'zzk273.github.io',
    'mmlab.hk',
    'humanoid-goalkeeper.github.io',
    'gallantloco.github.io',
    'physhsi.github.io',
    'liangpan99.github.io',
    'vankouf.github.io',
    'dl.acm.org',
    'yi-shi94.github.io',
    'gao-jiawei.com',
    'xizaoqu.github.io'
  ]);

  const isSafeUrl = (href) => {
    try {
      const url = new URL(href, window.location.href);
      if (url.protocol === 'mailto:') return true;
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
      return url.origin === window.location.origin || allowedHosts.has(url.hostname);
    } catch (_) {
      return false;
    }
  };

  const hardenLink = (link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    if (!isSafeUrl(href)) {
      link.dataset.blockedExternal = 'true';
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('rel', 'nofollow noopener noreferrer');
      return;
    }

    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin || url.protocol === 'mailto:') {
      link.setAttribute('rel', 'noopener noreferrer');
    }
  };

  if (window.top !== window.self) {
    try {
      window.top.location.href = window.location.href;
    } catch (_) {
      document.documentElement.style.display = 'none';
      window.addEventListener('DOMContentLoaded', () => {
        document.documentElement.style.display = '';
        document.body.replaceChildren();
        const notice = document.createElement('main');
        notice.className = 'security-notice';
        notice.innerHTML = '<h1>Open the original site</h1><p>This page blocks embedded copies to reduce clickjacking and ad injection risk.</p><a href="' + window.location.href + '" target="_top" rel="noopener noreferrer">Continue</a>';
        document.body.appendChild(notice);
      }, { once: true });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('base').forEach((base) => base.remove());
    document.querySelectorAll('a[href]').forEach(hardenLink);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches('base')) node.remove();
          if (node.matches('a[href]')) hardenLink(node);
          node.querySelectorAll('base').forEach((base) => base.remove());
          node.querySelectorAll('a[href]').forEach(hardenLink);
        });
      });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    if (link.dataset.blockedExternal === 'true' || !isSafeUrl(link.href)) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('Blocked unexpected external link:', link.href);
    }
  }, true);
})();
