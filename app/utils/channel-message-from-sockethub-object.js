import Message from 'hyperchannel/models/message';
import { isEmpty } from '@ember/utils';

export default function channelMessageFromSockethubObject(message) {
  let channelMessage = Message.create({
    type: message.object['@type'] === 'me' ? 'message-chat-me' : 'message-chat',
    date: extractDate(message.published),
    nickname: message.actor.displayName || message.actor['@id'],
    content: message.object.content
  });

  return channelMessage;
}

function extractDate(dateField) {
  if (isEmpty(dateField)) {
    return new Date();
  }

  // ISO 8601 date string
  if (dateField.toString().match(/^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i)) {
    return new Date(dateField);
  } else { // unix timestamp
    return new Date(Number(dateField));
  }
}
