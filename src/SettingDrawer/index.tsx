import './index.less';
import {
  CopyOutlined,
  CloseOutlined,
  NotificationOutlined,
  SettingOutlined,
} from '@ant-design/icons';

import { Slider, Button, Divider, Drawer, List, Switch, message, Alert, ConfigProvider } from 'antd';
import { createBrowserHistory } from 'history';
import { stringify, parse } from 'qs';
import React, { useMemo, useEffect, useRef } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import useMergeValue from 'use-merge-value';
import omit from 'omit.js';
import defaultSettings, { Settings } from '../defaultSettings';

import BlockCheckbox from './BlockCheckbox';
import ThemeColor from './ThemeColor';
import { isBrowser, genStringToTheme } from '../utils/utils';
import LayoutSetting, { renderLayoutSettingItem } from './LayoutChange';

interface BodyProps {
  title: string;
}

type MergerSettingsType<T> = Partial<T> & {
  primaryColor?: string;
  colorWeak?: boolean;
};

const Body: React.FC<BodyProps> = ({ children, title }) => (
  <div style={{ marginBottom: 24 }}>
    <h3 className="ant-pro-setting-drawer-title">{title}</h3>
    {children}
  </div>
);

export interface SettingItemProps {
  title: React.ReactNode;
  action: React.ReactElement;
  disabled?: boolean;
  disabledReason?: React.ReactNode;
}

export interface SettingDrawerProps {
  settings?: MergerSettingsType<Settings>;
  collapse?: boolean;
  getContainer?: any;
  publicPath?: string;
  zoom: any;
  RTL?: boolean;
  defaultHideHandler?: boolean;
  hideLoading?: boolean;
  hideColors?: boolean;
  hideHintAlert?: boolean;
  hideCopyButton?: boolean;
  formatMessage: (data: {
    id: string;
    defaultMessage?: string;
  }) => string;
  onCollapseChange?: (collapse: boolean) => void;
  onSettingChange?: (settings: MergerSettingsType<Settings>) => void;
}

export interface SettingDrawerState extends MergerSettingsType<Settings> {
  collapse?: boolean;
}

let oldSetting: MergerSettingsType<Settings> = {};

const getDifferentSetting = (state: Partial<Settings>) => {
  const stateObj: Partial<Settings> = {};
  Object.keys(state).forEach(key => {
    if (state[key] !== oldSetting[key] && key !== 'collapse') {
      stateObj[key] = state[key];
    }
  });

  delete stateObj.menu;
  return stateObj;
};

const getParamsFromUrl = (settings: MergerSettingsType<Settings>) => {
  if (!isBrowser()) {
    return defaultSettings;
  }
  // 第一次进入与 浏览器参数同步一下
  let params = {};
  if (window.location.search) {
    params = parse(window.location.search.replace('?', ''));
  }
  return {
    ...defaultSettings,
    ...settings,
    ...params,
  };
};

const genCopySettingJson = (settingState: MergerSettingsType<Settings>) =>
  JSON.stringify(
    omit(
      {
        ...settingState,
        primaryColor: genStringToTheme(settingState.primaryColor),
      },
      ['colorWeak'],
    ),
    null,
    2,
  );

/**
 * 可视化配置组件
 * @param props
 */
const SettingDrawer: React.FC<SettingDrawerProps> = props => {
  const {
    settings: propsSettings = {},
    hideLoading = false,
    hideColors,
    hideHintAlert,
    hideCopyButton,
    getContainer,
    formatMessage,
    RTL,
    defaultHideHandler,
    onSettingChange,
  } = props;
  const firstRender = useRef<boolean>(true);

  const [show, setShow] = useMergeValue(false, {
    value: props.collapse,
    onChange: props.onCollapseChange,
  });
  const [settingState, setSettingState] = useMergeValue<Partial<Settings>>(
    () => getParamsFromUrl(propsSettings),
    {
      value: propsSettings,
      onChange: onSettingChange,
    },
  );

  const {
    navTheme = 'dark',
    primaryColor = 'daybreak',
    layout = 'sidemenu',
    zoom = 0.95,
    colorWeak,
  } = settingState || {};

  const updateTheme = (
    dark: boolean,
    color?: string,
    hideMessageLoading = false,
    publicPath = '/theme',
  ) => {
    // ssr
    if (
      typeof window === 'undefined' ||
      !(window as any).huemix_themes
    ) {
      return;
    }
    let hide: any = () => null;
    if (!hideMessageLoading) {
      hide = message.loading(
        formatMessage({
          id: 'app.setting.loading',
          defaultMessage: '正在加载主题',
        }),
      );
    }

    const href = dark ? `${publicPath}/dark` : `${publicPath}/`;
    // 如果是 dark，并且是 color=daybreak，无需进行拼接
    let colorFileName =
      dark && color
        ? `-${encodeURIComponent(color)}`
        : encodeURIComponent(color || '');
    if (color === 'daybreak' && dark) {
      colorFileName = '';
    }

    const dom = document.getElementById('theme-style') as HTMLLinkElement;

    // 如果这两个都是空
    if (!href && !colorFileName) {
      if (dom) {
        dom.remove();
        localStorage.removeItem('site-theme');
      }
      return;
    }

    const url = `${href}${colorFileName || ''}.css`;
    if (dom) {
      dom.onload = () => {
        window.setTimeout(() => {
          hide();
        });
      };
      dom.href = url;
    } else {
      const style = document.createElement('link');
      style.type = 'text/css';
      style.rel = 'stylesheet';
      style.id = 'theme-style';
      style.onload = () => {
        window.setTimeout(() => {
          hide();
        });
      };
      style.href = url;
      if (document.body.append) {
        document.body.append(style);
      } else {
        document.body.appendChild(style);
      }
    }

    localStorage.setItem('site-theme', dark ? 'dark' : 'light');
  };

  /**
 * 初始化的时候需要做的工作
 * @param param0
 */
  const initState = (
    settings: Partial<Settings>,
    saveSettingChange: SettingDrawerProps['onSettingChange'],
    publicPath?: string,
  ) => {
    if (!isBrowser()) {
      return;
    }

    let loadedStyle = false;

    if (window.location.search) {
      const params = parse(window.location.search.replace('?', ''));
      const replaceSetting = {};
      Object.keys(params).forEach(key => {
        if (defaultSettings[key]) {
          replaceSetting[key] = params[key];
        }
      });
      if (saveSettingChange) {
        saveSettingChange({
          ...settings,
          ...replaceSetting,
        });
      }

      // 如果 url 中设置主题，进行一次加载。
      if (oldSetting.navTheme !== params.navTheme && params.navTheme) {
        updateTheme(
          settings.navTheme === 'realDark',
          params.primaryColor,
          true,
          publicPath,
        );
        loadedStyle = true;
      }
    }

    if (loadedStyle) {
      return;
    }

    // 如果 url 中没有设置主题，并且 url 中的没有加载，进行一次加载。
    if (defaultSettings.navTheme !== settings.navTheme && settings.navTheme) {
      updateTheme(
        settings.navTheme === 'realDark',
        settings.primaryColor,
        true,
        publicPath,
      );
    }
  };


  // eslint-disable-next-line consistent-return
  useEffect(() : void => {

    // 记住默认的选择，方便做 diff，然后保存到 url 参数中
    oldSetting = {
      ...defaultSettings,
      ...propsSettings,
    };

    /**
     * 如果不是浏览器 都没有必要做了
     */
    if (!isBrowser()) {
      return;
    }

    initState(settingState, setSettingState, props.publicPath);
  }, []);

  /**
   * 修改设置
   * @param key
   * @param value
   * @param hideMessageLoading
   */
  const changeSetting = (
    key: string,
    value: string | boolean,
    hideMessageLoading?: boolean,
  ) => {
    const nextState = { ...settingState };
    nextState[key] = value;

    if (key === 'navTheme') {
      updateTheme(
        value === 'realDark',
        undefined,
        hideMessageLoading,
        props.publicPath,
      );
      nextState.primaryColor = 'daybreak';
    }

    if (key === 'primaryColor') {
      updateTheme(
        nextState.navTheme === 'realDark',
        value === 'daybreak' ? '' : (value as string),
        hideMessageLoading,
        props.publicPath,
      );
    }

    if (key === 'layout') {
      nextState.contentWidth = value === 'topmenu' ? 'Fixed' : 'Fluid';
    }
    setSettingState(nextState);
  };

  const themeList = useMemo(() => {
    const list: {
      key: string;
      fileName: string;
      modifyVars: {
        '@primary-color': string;
      };
      theme: 'dark' | 'light';
    }[] = (window as any).huemix_themes || [];
    const themeL = [
      {
        key: 'light',
        url:
          'https://gw.alipayobjects.com/zos/antfincdn/NQ%24zoisaD2/jpRkZQMyYRryryPNtyIC.svg',
        title: formatMessage({ id: 'app.setting.pagestyle.light' }),
      },
      {
        key: 'dark',
        url:
          'https://gw.alipayobjects.com/zos/antfincdn/XwFOFbLkSM/LCkqqYNmvBEbokSDscrm.svg',
        title: formatMessage({
          id: 'app.setting.pagestyle.dark',
          defaultMessage: '',
        }),
      },
    ];

    const darkColorList: {
      key: string;
      color: string;
      theme: 'dark' | 'light';
    }[] = [
      {
        key: 'daybreak',
        color: '#1890ff',
        theme: 'dark',
      },
    ];

    const lightColorList: {
      key: string;
      color: string;
      theme: 'dark' | 'light';
    }[] = [
      {
        key: 'daybreak',
        color: '#1890ff',
        theme: 'dark',
      },
    ];

    if (list.find(item => item.theme === 'dark')) {
      themeL.push({
        key: 'realDark',
        url:
          'https://gw.alipayobjects.com/zos/antfincdn/hmKaLQvmY2/LCkqqYNmvBEbokSDscrm.svg',
        title: formatMessage({
          id: 'app.setting.pagestyle.dark',
          defaultMessage: '',
        }),
      });
    }
    // insert  theme color List
    list.forEach(item => {
      const color = (item.modifyVars || {})['@primary-color'];
      if (item.theme === 'dark' && color) {
        darkColorList.push({
          color,
          ...item,
        });
      }
      if (!item.theme || item.theme === 'light') {
        lightColorList.push({
          color,
          ...item,
        });
      }
    });

    return {
      colorList: {
        dark: darkColorList,
        light: lightColorList,
      },
      themeList: themeL,
    };
  }, []);

  useEffect(() => {
    /**
     * 如果不是浏览器 都没有必要做了
     */
    if (!isBrowser()) {
      return;
    }
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const browserHistory = createBrowserHistory();
    let params = {};
    if (window.location.search) {
      params = parse(window.location.search.replace('?', ''));
    }

    const diffParams = getDifferentSetting({ ...params, ...settingState });
    if (Object.keys(settingState).length < 1) {
      return;
    }

    browserHistory.replace({
      search: stringify(diffParams),
    });
  }, [JSON.stringify(settingState)]);

  return (
    <ConfigProvider direction={RTL ? 'rtl' : 'ltr'}>
      <Drawer
        visible={show}
        width={300}
        onClose={() => setShow(false)}
        placement={RTL ? "left" : "right"}
        getContainer={getContainer}
        handler={
          <div
            className="ant-pro-setting-drawer-handle"
            style={defaultHideHandler ? { display: 'none' } : undefined}
            onClick={() => setShow(!show)}
          >
            {show ? (
              <CloseOutlined
                style={{
                  color: '#fff',
                  fontSize: 20,
                }}
              />
            ) : (
              <SettingOutlined
                style={{
                  color: '#fff',
                  fontSize: 20,
                }}
              />
            )}
          </div>
        }
        style={{
          zIndex: 999,
        }}
      >
        <div className="ant-pro-setting-drawer-content">
          <Body
            title={formatMessage({
              id: 'app.setting.pagestyle',
              defaultMessage: 'Page style setting',
            })}
          >
            <BlockCheckbox
              list={themeList.themeList}
              value={navTheme}
              formatMessage={formatMessage}
              onChange={value => changeSetting('navTheme', value, hideLoading)}
            />
          </Body>

          <ThemeColor
            title={formatMessage({ id: 'app.setting.themecolor' })}
            value={primaryColor}
            colors={
              hideColors
                ? []
                : themeList.colorList[navTheme === 'realDark' ? 'dark' : 'light']
            }
            formatMessage={formatMessage}
            onChange={color => changeSetting('primaryColor', color, hideLoading)}
          />

          <Divider />

          <Body title={formatMessage({ id: 'app.setting.navigationmode' })}>
            <BlockCheckbox
              formatMessage={formatMessage}
              value={layout}
              onChange={value => changeSetting('layout', value, hideLoading)}
            />
          </Body>
          <LayoutSetting formatMessage={formatMessage} settings={settingState} changeSetting={changeSetting} />
          <Divider />

          <Body title={formatMessage({ id: 'app.setting.zoom' })}>
            <Slider value={zoom} onChange={value => changeSetting('zoom', value, hideLoading)} max={1.5} min={0.9} step={0.1} tooltipVisible />
          </Body>
          <Divider />
          <Body title={formatMessage({ id: 'app.setting.othersettings' })}>
            <List
              split={false}
              renderItem={renderLayoutSettingItem}
              dataSource={[
                {
                  title: formatMessage({ id: 'app.setting.weakmode' }),
                  action: (
                    <Switch
                      size="small"
                      checked={!!colorWeak}
                      onChange={checked => changeSetting('colorWeak', checked)}
                    />
                  ),
                },
              ]}
            />
          </Body>
          {hideHintAlert && hideCopyButton ? null : <Divider />}

          {hideHintAlert ? null : (
            <Alert
              type="warning"
              message={formatMessage({
                id: 'app.setting.production.hint',
              })}
              icon={<NotificationOutlined />}
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {hideCopyButton ? null : (
            <CopyToClipboard
              text={genCopySettingJson(settingState)}
              onCopy={() =>
                message.success(formatMessage({ id: 'app.setting.copyinfo' }))
              }
            >
              <Button block>
                <CopyOutlined /> {formatMessage({ id: 'app.setting.copy' })}
              </Button>
            </CopyToClipboard>
          )}
        </div>
      </Drawer>
    </ConfigProvider>
  );
};

export default SettingDrawer;
