import Application from 'hyperchannel/app';
import config from 'hyperchannel/config/environment';
import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';

setApplication(Application.create(config.APP));

start();
