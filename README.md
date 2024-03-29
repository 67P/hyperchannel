[![Build Status](https://travis-ci.com/67P/hyperchannel.svg?branch=master)](https://travis-ci.org/67P/hyperchannel)
[![Code Climate](https://img.shields.io/codeclimate/maintainability/67P/hyperchannel.svg)](https://codeclimate.com/github/67P/hyperchannel)

# Hyperchannel (alpha!)

**Hyperchannel** is the unhosted client application of the
[Kosmos](https://kosmos.org) Chat project. It is based on
[Ember.js](https://emberjs.com), connecting to IRC/XMPP/etc. via
[Sockethub](http://sockethub.org) (WebSockets + ActivityStreams), and
optionally syncing configuration and user data via
[remoteStorage](https://remotestorage.io) (Webfinger + OAuth + CORS + REST).

Hyperchannel is not yet ready for public use, but contributions are very
welcome. If you know JavaScript, and ideally even have experience with
Ember.js, it is easy to hack on any feature imaginable. Check the [GitHub
issues](https://github.com/67P/hyperchannel/issues) to find things you could
start implementing right away.

If you have any questions, please feel free to ask
[in one of our chatrooms](https://wiki.kosmos.org/Main_Page#Chat).

## Prerequisites

You will need the following things properly installed on your computer.

* [Git](https://git-scm.com/)
* [Node.js](https://nodejs.org/) (with npm)
* [Ember CLI](https://ember-cli.com/)
* [Sockethub](http://sockethub.org/)
* [Google Chrome](https://google.com/chrome/)

## Installation

* `git clone git@github.com:67P/hyperchannel.git` this repository
* change into the new directory
* `npm install`
* https://github.com/sockethub/sockethub/wiki/Installing-Sockethub

## Running / Development

* `npm start`
* Visit the app at [http://localhost:4200](http://localhost:4200).
* Visit your tests at [http://localhost:4200/tests](http://localhost:4200/tests).

### Code Generators

Make use of the many generators for code, try `ember help generate` for more details

Caveat: when running the model generator, make sure to adjust the unit test to
not use moduleForModel, as we're not using Ember Data. See existing tests.

### Running Tests

* `npm test`
* `npm test -- --server` (will re-run on saving files)

### Linting

* `npm run lint:hbs`
* `npm run lint:js`
* `npm run lint:js -- --fix`

### Building

(Not yet used.)

* `npm build` (development)
* `npm build --environment production` (production)

### Deploying

With push permission for the production Git repo:

* `npm run deploy`

## Further Reading / Useful Links

* [ember.js](https://emberjs.com/)
* [ember-cli](https://ember-cli.com/)
* Development Browser Extensions
  * [ember inspector for chrome](https://chrome.google.com/webstore/detail/ember-inspector/bmdblncegkenkacieihfhpjfppoconhi)
  * [ember inspector for firefox](https://addons.mozilla.org/en-US/firefox/addon/ember-inspector/)

## House Rules

[Contributor Code of Conduct](http://contributor-covenant.org/version/1/2/0/) (TL;DR: Be excellent to each other.)
