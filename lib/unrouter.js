'use strict';

const React = require('react');

const call = require('call');
const invariant = require('fbjs/lib/invariant');

const RenderWithPath = React.createClass({
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

const unrouter = {
  createMatcher(config) {
    invariant(config && typeof config === 'object', 'createRouter() expects an object');

    let router = new call.Router();
    for (let path in config) {
      invariant(typeof config[path] === 'function', 'createRouter() expects all values to be functions');
      router.add({method: 'get', path: path}, config[path]);
    }

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
    return unrouter.createRouter(config)(path);
  },

  renderWithPath(history, cb) {
    invariant(
      history && typeof history.getCurrentLocation === 'function',
      'renderWithPath() expects a history instance'
    );
    invariant(typeof cb === 'function', 'renderWithPath() expects a function');

    return React.createElement(RenderWithPath, {history, cb});
  },
};

module.exports = unrouter;
