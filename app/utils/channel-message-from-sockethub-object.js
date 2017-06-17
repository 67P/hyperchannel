import Message from 'hyperchannel/models/message';

export default function channelMessageFromSockethubObject(message) {
  let channelMessage = Message.create({
    type: message.object['@type'] === 'me' ? 'message-chat-me' : 'message-chat',
    date: new Date(message.published),
    nickname: message.actor.displayName || message.actor['@id'],
    content: message.object.content
  });

  return channelMessage;
}
