'use strict';

const React = require('react');

const assign = require('object-assign');
const call = require('call');
const invariant = require('fbjs/lib/invariant');
const mapObject = require('fbjs/lib/mapObject');

const PathSegment = {
  create(value, location) {
    value = value || '';
    invariant(typeof value === 'string', 'path must be a string');

    if (!value.startsWith('/')) {
      value = '/' + value;
    }

    let segment = new String(value);
    segment.location = location;
    return segment;
  },

  getChild(prevPathSegment, nextValue) {
    invariant(PathSegment.isPathSegment(prevPathSegment), 'Expected PathSegment');
    return PathSegment.create(nextValue, prevPathSegment.location);
  },

  isPathSegment(path) {
    return path instanceof String && path.hasOwnProperty('location');
  },

  ensurePathSegment(path) {
    if (PathSegment.isPathSegment(path)) {
      return path;
    } else {
      return PathSegment.create(path, null);
    }
  },
};

const RenderWithPath = React.createClass({
  childContextTypes: {
    history: React.PropTypes.object,
  },

  getChildContext() {
    return {history: this.props.history};
  },

  getInitialState() {
    return {location: null};
  },

  componentWillMount() {
    this.version = 0;
    this._unlisten = this.props.history.listen(this.handleHistoryChange);
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.history !== nextProps.history) {
      this._unlisten();
      this._unlisten = nextProps.history.listen(this.handleHistoryChange);
    }
  },

  handleHistoryChange(location) {
    this.setState({location});
  },

  componentWillUnmount() {
    this._unlisten();
  },

  render() {
    return this.props.cb(PathSegment.create(this.state.location.pathname, this.state.location));
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
      path = PathSegment.ensurePathSegment(path);

      const match = router.route('get', path.toString());
      if (match.isBoom) {
        throw match;
      }

      return match.route(mapObject(match.params, value => PathSegment.getChild(path, value)));
    };
  },

  matchRoute(path, config) {
    return unrouter.createMatcher(config)(path);
  },


  // Likely bad ideas:
  // - a better way for updating paths? maybe overkill?
  // getPath('path/{to}/{foo}', this.props.path, {foo: 'bar'});
  // example:
  // getPath('/profile/{username}/{tab}', '/profile/floydophone/photos', {tab: 'friends'})

  // - a way to bind component state to the URL? maybe overkill?

  // Good idea:
  // A way to handle the Smyte pushing/stacking problem. Attach a version number to the path string? history state?

  renderWithPath(history, cb) {
    invariant(
      history && typeof history.listen === 'function',
      'renderWithPath() expects a history instance'
    );
    invariant(typeof cb === 'function', 'renderWithPath() expects a function');

    return React.createElement(RenderWithPath, {history, cb});
  },

  A,
};

module.exports = unrouter;
