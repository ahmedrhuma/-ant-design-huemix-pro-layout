import './index.less';

import React, { Component } from 'react';
import classNames from 'classnames';
import { FullscreenOutlined, FullscreenExitOutlined, MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { HeaderViewProps } from '../Header';
import { defaultRenderLogo, SiderMenuProps } from '../SiderMenu/SiderMenu';
import { isBrowser } from '../utils/utils';
import { WithFalse } from '../typings';

export interface GlobalHeaderProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  isMobile?: boolean;
  fullScreenButton?: boolean;
  logo?: React.ReactNode;
  menuRender?: HeaderViewProps['menuRender'];
  collapsedButtonRender?: WithFalse<(collapsed?: boolean) => React.ReactNode>;
  rightContentRender?: HeaderViewProps['rightContentRender'];
  className?: string;
  style?: React.CSSProperties;
  menuHeaderRender?: SiderMenuProps['menuHeaderRender'];
}

const defaultRenderCollapsedButton = (collapsed?: boolean) =>
  collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />;

const renderLogo = (
  menuHeaderRender: SiderMenuProps['menuHeaderRender'],
  logoDom: React.ReactNode,
) => {
  if (menuHeaderRender === false) {
    return null;
  }
  if (menuHeaderRender) {
    return menuHeaderRender(logoDom, null);
  }
  return logoDom;
};

export default class GlobalHeader extends Component<GlobalHeaderProps> {
  state = {
    fullscreen: false
  };

  triggerResizeEvent = () => {
    if (isBrowser()) {
      const event = document.createEvent('HTMLEvents');
      event.initEvent('resize', true, false);
      window.dispatchEvent(event);
    }
  };

  toggle = () => {
    const { collapsed, onCollapse } = this.props;
    if (onCollapse) onCollapse(!collapsed);
    this.triggerResizeEvent();
  };

  renderCollapsedButton = () => {
    const {
      collapsed,
      collapsedButtonRender = defaultRenderCollapsedButton,
      menuRender,
    } = this.props;

    if (collapsedButtonRender !== false && menuRender !== false) {
      return (
        <span className="ant-pro-global-header-trigger" onClick={this.toggle}>
          {collapsedButtonRender(collapsed)}
        </span>
      );
    }

    return null;
  };

  requestFullScreen = () => {
    const isInFullScreen : any = (document['fullscreenElement'] && document['fullscreenElement'] !== null) ||
      (document['webkitFullscreenElement'] && document['webkitFullscreenElement'] !== null) ||
      (document['mozFullScreenElement'] && document['mozFullScreenElement'] !== null) ||
      (document['msFullscreenElement'] && document['msFullscreenElement'] !== null);

    const element : any = document.getElementById('root');
    // Supports most browsers and their versions.
    let requestMethod;
    if (isInFullScreen){
      requestMethod = document['exitFullscreen'] || document['webkitExitFullscreen'] || document['mozCancelFullScreen'] || document['msExitFullscreen'];
    }
    else requestMethod = element.requestFullscreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

    if (requestMethod) { // Native full screen.
        if (isInFullScreen) requestMethod.call(document);
        else requestMethod.call(element);
    } else if (typeof window['ActiveXObject'] !== "undefined") { // Older IE.
        // eslint-disable-next-line no-undef
        const wscript = new ActiveXObject("WScript.Shell");
        if (wscript !== null) {
            wscript.SendKeys("{F11}");
        }
    }

    // eslint-disable-next-line react/no-access-state-in-setstate
    this.setState({ fullscreen: !isInFullScreen });
  }

  fullScreenButton = () => <span className="ant-pro-global-header-trigger" onClick={this.requestFullScreen}>
    {this.renderFullScreenButton()}
  </span>;

  renderFullScreenButton = () => this.state.fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />;

  render(): React.ReactNode {
    const {
      isMobile,
      logo,
      rightContentRender,
      menuHeaderRender,
      className: propClassName,
      style,
      fullScreenButton
    } = this.props;
    const className = classNames(propClassName, 'ant-pro-global-header');

    const logoDom = (
      <span className="ant-pro-global-header-logo" key="logo">
        {defaultRenderLogo(logo)}
      </span>
    );
    return (
      <div className={className} style={style}>
        {isMobile && renderLogo(menuHeaderRender, logoDom)}
        {this.renderCollapsedButton()}
        {fullScreenButton ? this.fullScreenButton() : null}
        <div style={{ flex: 1 }} />
        {rightContentRender && rightContentRender(this.props)}
      </div>
    );
  }
}
