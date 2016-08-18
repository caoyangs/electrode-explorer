/* globals document _COMPONENTS setTimeout setInterval clearInterval fetch */

import React from "react";
import Revealer from "@walmart/wmreact-interactive/lib/components/revealer";
import Chooser from "@walmart/wmreact-chooser/lib/components/chooser";
import ExecutionEnvironment from "exenv";
import Config from "@walmart/electrode-ui-config";
import marked from "marked";

export default class Component extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      meta: {},
      usage: [],
      deps: [],
      demo: null,
      doc: null,
      currentVersion: null,
      latestVersion: null,
      error: null
    };
  }

  componentWillMount() {
    if (!ExecutionEnvironment.canUseDOM) {
      return;
    }

    const { org, repo, version } = this.props.params;

    const currentVersion = parseInt(version);
    if (!isNaN(currentVersion)) {
      this.setState({ currentVersion });
    }

    Promise.all([
      this._getComponentInfo(org, repo),
      this._getDoc(org, repo)
    ]);
  }

  _getComponentInfo(org, repo) {
    const host = window.location.origin;
    const url = `${host}/explorer/data/${org}/${repo}.json`;

    const compare = (a, b) => {
      if (a.displayName < b.displayName) {
        return -1;
      }
      if (a.displayName > b.displayName) {
        return 1;
      }
      return 0;
    };

    return fetch(url)
      .then((res) => {
        if (res.status >= 400) {
          throw res;
        }
        return res.json();
      })
      .then((res) => {
        const meta = res.meta || {};
        const usage = res.usage.sort(compare);

        const deps = res.deps || [];
        deps.sort(compare);

        const latestVersion = parseInt(meta.version.substring(0, meta.version.indexOf(".")));
        const currentVersion = this.state.currentVersion || latestVersion;

        this.setState({ meta, usage, deps, latestVersion, currentVersion });

        this._getDemo(meta);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  _getDemo(meta) {
    const host = window.location.origin;
    const script = document.createElement("script");
    const { currentVersion } = this.state;
    script.src = `${host}/explorer/data/demo-modules/${meta.name}/v${currentVersion}/bundle.min.js`;
    script.async = true;

    const placeholder = document.getElementById("placeholder");
    placeholder.appendChild(script);

    const x = setInterval(() => {
      if (typeof _COMPONENTS !== "undefined" && _COMPONENTS[meta.name]) {
        this.setState({ demo: _COMPONENTS[meta.name] });
        clearInterval(x);
      }
    }, 500);

    setTimeout(() => {
      if (typeof _COMPONENTS === "undefined") {
        clearInterval(x);
        this.setState({ error: true });
      }
    }, Config.ui.timeout);
  }

  _getDoc(org, repo) {
    const host = window.location.origin;
    const url = `${host}/explorer/api/doc/${org}/${repo}`;

    return fetch(url)
      .then((res) => {
        if (res.status >= 400) {
          throw res;
        }
        return res.json();
      })
      .then((res) => {
        this.setState({ doc: marked(res.doc) });
      })
      .catch(() => {
        this.setState({ doc: marked("# Error fetching doc") });
      });
  }

  _renderUsage(usage, deps) {
    return (
      <div className="component-consumption">
        <h3>Component Usage</h3>
        { usage.length > 0 && <Revealer
          baseHeight={50}
          buttonClosedText="View Usage"
          buttonOpenText="Hide Usage"
          defaultOpen={false}
          disableClose={false}
          inverse={true}
          fakeLink={false}
          border={false}>
          <div className="component-usage">
            This component is used in <em>{usage.length}</em> modules / apps.
            { this._renderModuleData(usage) }
            </div>
        </Revealer> }
        <h3>Module Dependencies</h3>
        { deps.length > 0 && <Revealer
          baseHeight={50}
          buttonClosedText="View Dependencies"
          buttonOpenText="Hide Dependencies"
          defaultOpen={false}
          disableClose={false}
          inverse={true}
          fakeLink={false}
          border={false}>
          <div className="component-dependencies">
            This component has <em>{deps.length}</em> Electrode dependencies.
            { this._renderModuleData(deps) }
          </div>
        </Revealer> }
      </div>
    );
  }

  _renderTitle(meta) {
    return (
      <h2 className="explorer-title">
        { meta.title }

        { meta.version &&
          <span className="component-version">
            {` v${meta.version}`}
          </span> }

        { this._renderVersion() }

        { meta.description &&
          <span className="component-description">
            {meta.description}
          </span> }

        <span className="component-info">
          { meta.github &&
            <div>
              <a href={meta.github} target="_blank">View Repository on Github</a>
            </div> }
          { meta.name &&
            <div className="code-well">
              npm i --save {meta.name}
            </div> }
        </span>

      </h2>
    );
  }

  _onVersionChange(currentVersion) {
    const { org, repo } = this.props.params;
    const prev = this.state.currentVersion;

    if (typeof currentVersion === "number" && prev !== currentVersion) {
      window.location.pathname = Config.fullPath(`/${org}/${repo}/${currentVersion}`);
    }
  }

  _renderVersionOptions() {
    const chooser = [
      <Chooser.Option value="Select">
        Select
      </Chooser.Option>
    ];
    const { latestVersion } = this.state;

    if (latestVersion === 0) {
      chooser.push(
        <Chooser.Option value={0}>
          v0
        </Chooser.Option>
      );
    } else {
      for (let i = 1; i <= latestVersion; i += 1) {
        chooser.push(
          <Chooser.Option value={i}>
            {`v${i}`}
          </Chooser.Option>
        );
      }
    }

    return chooser;
  }

  _renderVersion() {
    const { latestVersion, currentVersion } = this.state;

    const placeholder = currentVersion || latestVersion;
    return latestVersion ? (
      <span className="switch-version">
        <span className="switch-version-text">Switch version:</span>
        <Chooser
          chooserName="Version"
          placeholderText={`v${placeholder}`}
          onChange={this._onVersionChange.bind(this)}>
          { this._renderVersionOptions() }
        </Chooser>
      </span>
    ) : null;
  }

  _renderDoc() {
    const { doc } = this.state;

    return (
      <div className="explorer-title">
        <Revealer
          baseHeight={0}
          buttonClosedText="View Doc"
          buttonOpenText="Hide Doc"
          defaultOpen={false}
          disableClose={false}
          inverse={true}
          fakeLink={false}
          border={false}>
          <div className="component-dependencies" dangerouslySetInnerHTML={{ __html: doc }} />
        </Revealer>
      </div>
    );
  }

  _renderModuleData(data) {
    return (
      <table>
        <tbody>
          {data.map((detail) => (
            <tr>
              <td>
                <a href={detail.uri} target="_blank" className="detail-uri">
                  {detail.displayName}
                </a>
              </td>
              <td className="detail-version">
                <span className={`version-status-${detail.version && detail.version.status}`}>
                  {detail.version && detail.version.str}
                </span>
              </td>
              <td className="detail-description">
                {detail.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  _renderDemo() {
    const { demo, error } = this.state;

    if (!demo && !error) {
      return (<div>Loading, please wait.</div>);
    }

    if (!demo && error) {
      return (<b>This component does not have demo or demo does not work properly.</b>);
    }

    return React.createElement(demo);
  }

  render() {
    const { meta, usage, deps } = this.state;

    if (!meta.title) {
      meta.title = this.props.params.repo || "[ Missing Title ]";
    }

    return (
      <div>
        { this._renderTitle(meta) }
        { this._renderDoc() }
        <div id="placeholder" />
        <div className="demo">
          { this._renderDemo() }
        </div>
        { this._renderUsage(usage, deps) }
      </div>
    );
  }
}

Component.propTypes = {
  params: React.PropTypes.shape({
    org: React.PropTypes.string,
    repo: React.PropTypes.string,
    version: React.PropTypes.string
  })
};
