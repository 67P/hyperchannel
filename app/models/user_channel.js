import { tracked } from '@glimmer/tracking';
import BaseChannel from 'hyperchannel/models/base_channel';

export default class UserChannel extends BaseChannel {
  @tracked isUserChannel = true;
}
