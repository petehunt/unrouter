'use strict';

const React = require('react');

const assign = require('object-assign');
const call = require('call');
const invariant = require('fbjs/lib/invariant');
const mapObject = require('fbjs/lib/mapObject');

class Path {
  constructor(path, location) {
    this.path = path;
    this.location = location;
  }

  toString() {
    let pathString = this.path;

    if (!pathString.startsWith('/')) {
      pathString = '/' + pathString;
    }

    return pathString;
  }

  static fromLocation(location) {
    return new Path(location.pathname, location);
  }

  static fromString(path) {
    return new Path(path, null);
  }

  static ensurePath(path) {
    if (path instanceof Path) {
      return path;
    }

    invariant(typeof path === 'string', 'path must be a string');

    return Path.fromString(path);
  }

  getChildPath(path) {
    return new Path(path, this.location);
  }
}

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
    return this.props.cb(this.state.location.pathname);
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
      path = Path.ensurePath(path);

      const match = router.route('get', path.toString());
      if (match.isBoom) {
        throw match;
      }

      return match.route(mapObject(match.params, value => path.getChildPath(value)));
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
