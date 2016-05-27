'use strict';

const React = require('react');

const assign = require('object-assign');
const call = require('call');
const invariant = require('fbjs/lib/invariant');

const RenderWithPath = React.createClass({
  childContextTypes: {
    history: React.PropTypes.object,
  },

  getChildContext() {
    return {history: this.props.history};
  },

  componentDidMount() {
    this._unlisten = this.props.history.listen(this.forceUpdate.bind(this));
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.history !== nextProps.history) {
      this._unlisten();
      this._unlisten = nextProps.history.listen(this.forceUpdate.bind(this));
    }
  },

  componentWillUnmount() {
    this._unlisten();
  },

  render() {
    return this.props.cb(this.props.history.getCurrentLocation().pathname);
  },
});

const A = React.createClass({
  contextTypes: {
    history: React.PropTypes.object,
  },

  handleClick(e) {
    if (this.props.href) {
      e.preventDefault();
      this.context.history.push(this.props.href);
    }
  },

  render() {
    const props = assign({
      onClick: this.handleClick,
    }, this.props);
    return React.createElement('a', props);
  },
});

const unrouter = {
  _createRouter(config) {
    invariant(config && typeof config === 'object', 'createRouter() expects an object');

    let router = new call.Router();
    for (let path in config) {
      invariant(typeof config[path] === 'function', 'createRouter() expects all values to be functions');
      router.add({method: 'get', path: path}, config[path]);
    }

    return router;
  },

  createMatcher(config) {
    const router = unrouter._createRouter(config);

    return path => {
      const match = router.route('get', path);
      if (match.isBoom) {
        throw match;
      }

      const rv = match.route(match.params).route;
      invariant(React.isValidElement(rv), 'Route callback must return a valid ReactElement');
      return rv;
    };
  },

  matchRoute(path, config) {
    return unrouter.createMatcher(config)(path);
  },

  // TODO: a better way for updating paths? maybe overkill?
  // getPath('path/{to}/{foo}', this.props.path, {foo: 'bar'});
  // example:
  // getPath('/profile/{username}/{tab}', '/profile/floydophone/photos', {tab: 'friends'})

  // TODO: a way to bind component state to the URL? maybe overkill?

  renderWithPath(history, cb) {
    invariant(
      history && typeof history.getCurrentLocation === 'function',
      'renderWithPath() expects a history instance'
    );
    invariant(typeof cb === 'function', 'renderWithPath() expects a function');

    return React.createElement(RenderWithPath, {history, cb});
  },

  A,
};

module.exports = unrouter;
