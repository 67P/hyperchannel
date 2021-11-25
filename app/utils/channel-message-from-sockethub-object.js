import { isEmpty } from '@ember/utils';
import Message from 'hyperchannel/models/message';

export default function channelMessageFromSockethubObject(message) {
  const channelMessage = new Message({
    type: message.object['@type'] === 'me' ? 'message-chat-me' : 'message-chat',
    date: extractDate(message.published),
    nickname: extractNickname(message.actor),
    content: message.object.content,
  });
  return channelMessage;
}

function extractNickname(actor) {
  if (actor.displayName) {
    return actor.displayName;
  } else {
    const matchChannelUser = actor['@id'].match(/^.+@.+\/(.*)$/);
    return matchChannelUser ? matchChannelUser[1] : actor['@id'];
  }
}

function extractDate(dateField) {
  if (isEmpty(dateField)) {
    return new Date();
  }

  // ISO 8601 date string
  if (
    dateField
      .toString()
      .match(
        /^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i
      )
  ) {
    return new Date(dateField);
  } else {
    // unix timestamp
    return new Date(Number(dateField));
  }
}
