import Application from 'hyperchannel/app';
import config from 'hyperchannel/config/environment';
import * as QUnit from 'qunit';
import { setApplication } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { start } from 'ember-qunit';
import setupSinon from 'ember-sinon-qunit';

setup(QUnit.assert);

setApplication(Application.create(config.APP));

setupSinon();

start();
