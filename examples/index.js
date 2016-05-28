'use strict';

const React = require('react');
const ReactDOM = require('react-dom');

const history = require('history');
const unrouter = require('../');

const Profile = React.createClass({
  render() {
    const content = unrouter.matchRoute(this.props.path, {
      '/': () => 'info',
      '/info': () => 'info',
      '/photos': () => 'photos',
    });

    return <div style={{marginLeft: 20}}>Profile for {this.props.user}: {content}</div>;
  },

});

const Newsfeed = React.createClass({
  render() {
    return <div>Newsfeed</div>;
  },
});

const Root = React.createClass({
  render() {
    const h = history.createHashHistory();
    return unrouter.renderWithPath(h, path => {
      const [activeTab, content] = unrouter.matchRoute(path, {
        '/newsfeed': () => ['newsfeed', <Newsfeed />],
        '/profile/{user}/{path*}': params => ['profile', <Profile user={params.user} path={params.path} />],
      });

      const activeStyle = {color: 'red'};

      return (
        <div>
          <h1>Root of my app</h1>
          <div>
            <unrouter.A href="/newsfeed" style={activeTab === 'newsfeed' ? activeStyle : null}>Newsfeed</unrouter.A>
            <unrouter.A href="/profile/me" style={activeTab === 'profile' ? activeStyle : null}>Profile</unrouter.A>
          </div>
          {content}
        </div>
      );
    });
  },
});

ReactDOM.render(<Root />, document.body);
