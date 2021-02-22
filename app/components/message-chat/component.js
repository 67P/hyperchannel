/* global linkifyStr */
import Component from '@glimmer/component';
import { action } from '@ember/object';
import { htmlSafe } from '@ember/string';
import moment from 'moment';

export default class MessageChatComponent extends Component {

  get datetime () {
    return moment(this.args.message.date).format('YYYY-MM-DD[T]HH:mm');
  }

  get dateTitle () {
    return moment(this.args.message.date).format('YYYY-MM-DD [at] HH:mm');
  }

  get formattedContent () {
    const content = this.args.message.content;
    let out;

    // Images
    if (content.match(/^(http)s?:\/\/.*(gif|png|jpg|jpeg)$/i)) {
      out = `<br><a href="${content}" target="_blank" rel="nofollow noopener">` +
            `<img src="${content}" class="from-image-url" alt="${content}">` +
            `</a>`;
    }
    // Other links
    else {
      out = linkifyStr(content, {
        linkAttributes: { rel: 'nofollow noopener' },
        validate: {
          url: function (value) {
            return /^(http)s?:\/\//.test(value);
          },
          email: function () { return false; }
        }
      });
    }

    // Colors
    out = out.replace(/\u0003(\d+)/g, '<span class="color-$1">')
             .replace(/"color-(\d)"/g, '"color-0$1"')
             .replace(/\u0002/g, '<span class="bold">')
             .replace(/\u001D/g, '<span class="italic">')
             .replace(/\u000f/g,  '</span>');

    return htmlSafe(out);
  }

  @action
  usernameClick (username) {
    this.args.onUsernameClick(username);
  }
}
