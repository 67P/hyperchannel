import Message from 'hyperchannel/models/message';

export default function channelMessageFromSockethubObject(message) {
  let messageDate;
  if (message.published) {
    // ISO 8601 date string
    if (message.published.toString().match(/^\d{4}(-\d\d(-\d\d(T\d\d:\d\d(:\d\d)?(\.\d+)?(([+-]\d\d:\d\d)|Z)?)?)?)?$/i)) {
      messageDate = new Date(message.published);
    } else { // unix timestamp
      messageDate = new Date(Number(message.published));
    }
  } else {
    messageDate = new Date();
  }

  let channelMessage = Message.create({
    type: message.object['@type'] === 'me' ? 'message-chat-me' : 'message-chat',
    date: messageDate,
    nickname: message.actor.displayName || message.actor['@id'],
    content: message.object.content
  });

  return channelMessage;
}
