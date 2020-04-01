import Controller from '@ember/controller';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class ApplicationController extends Controller {

  @service coms;
  @alias('coms.spaces') spaces;

  @tracked showGlobalMenu = false;
  @tracked showChannelMenu = false;

}
