import linkifyStr from 'linkify-string';
import { htmlSafe } from '@ember/template';

/**
 * Formats a chat message body into safe HTML: linkifies URLs, embeds images
 * for direct image URLs, and translates IRC color/formatting control codes.
 *
 * @param {string} content
 * @returns {import('@ember/template').SafeString}
 */
export default function formatMessageContent (content) {
  let out;

  // Images
  if (content.match(/^(http)s?:\/\/.*(gif|png|jpg|jpeg)$/i)) {
    out = `<a href="${content}" target="_blank" rel="nofollow noopener">` +
          `<img src="${content}" ` +
          `class="my-1 p-1 h-48 w-auto max-w-full md:max-w-7xl border border-neutral-200 hover:border-neutral-400">` +
          `</a>`;
  }
  // Other links
  else {
    out = linkifyStr(content, {
      attributes: {
        rel: 'nofollow noopener',
        target: '_blank'
      },
      validate: {
        url: function (value) {
          return /^(http)s?:\/\//.test(value);
        },
        email: function () { return false; }
      }
    });
  }

  // Colors
  // eslint-disable-next-line no-control-regex
  out = out.replace(/\u0003(\d+)/g, '<span class="color-$1">')
           .replace(/"color-(\d)"/g, '"color-0$1"')
           // eslint-disable-next-line no-control-regex
           .replace(/\u0002/g, '<span class="bold">')
           // eslint-disable-next-line no-control-regex
           .replace(/\u001D/g, '<span class="italic">')
           // eslint-disable-next-line no-control-regex
           .replace(/\u000f/g,  '</span>')
           .replace(/(?:\r\n|\r|\n)/g, '<br>');

  return htmlSafe(out);
}
