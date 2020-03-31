import { mount, render } from 'enzyme';
import React from 'react';
import SettingDrawer, { SettingDrawerProps } from '../../src/SettingDrawer';
import defaultSettings from './defaultSettings';
import { waitForComponentToPaint } from './util';

const formatMessage = (): ((data: {
  id: string;
  defaultMessage?: string;
}) => string) => {
  const fm = ({
    id,
    defaultMessage,
  }: {
    id: string;
    defaultMessage?: string;
  }): string => {
    const locales = ['ar-LY', 'en-US'];
    if (locales[id]) {
      return locales[id];
    }
    if (defaultMessage) {
      return defaultMessage as string;
    }
    return id;
  };
  return fm;
};

describe('settingDrawer.test', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn(() => ({
        matches: false,
        addListener() {},
        removeListener() {},
      })),
    });
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'zh-CN'),
      },
    });
  });

  it('base user', () => {
    const html = render(
      <SettingDrawer
        settings={defaultSettings}
        getContainer={false}
        formatMessage={formatMessage}
        collapse
      />,
    );
    expect(html).toMatchSnapshot();
  });

  it('settings = undefined', () => {
    const html = render(
      <SettingDrawer
        settings={undefined as any}
        getContainer={false}
        formatMessage={formatMessage}
        collapse
      />,
    );
    expect(html).toMatchSnapshot();
  });

  it('hideColors = true', () => {
    const html = render(
      <SettingDrawer
        settings={defaultSettings}
        formatMessage={formatMessage}
        hideColors
        getContainer={false}
        collapse
      />,
    );
    expect(html).toMatchSnapshot();
  });

  it('hideHintAlert = true', () => {
    const html = render(
      <SettingDrawer
        settings={defaultSettings}
        hideHintAlert
        formatMessage={formatMessage}
        getContainer={false}
        collapse
      />,
    );
    expect(html).toMatchSnapshot();
  });

  it('hideLoading = true', () => {
    const html = render(
      <SettingDrawer
        settings={defaultSettings}
        formatMessage={formatMessage}
        hideLoading
        getContainer={false}
        collapse
      />,
    );
    expect(html).toMatchSnapshot();
  });

  it('hideCopyButton = true', () => {
    const html = render(
      <SettingDrawer
        settings={defaultSettings}
        formatMessage={formatMessage}
        hideCopyButton
        getContainer={false}
        collapse
      />,
    );
    expect(html).toMatchSnapshot();
  });

  it('onCollapseChange', async () => {
    const onCollapseChange = jest.fn();
    const wrapper = mount(
      <SettingDrawer
        settings={defaultSettings}
        formatMessage={formatMessage}
        collapse
        getContainer={false}
        onCollapseChange={onCollapseChange}
      />,
    );
    await waitForComponentToPaint(wrapper);
    const button = wrapper.find('.ant-pro-setting-drawer-handle');
    button.simulate('click');
    expect(onCollapseChange).toHaveBeenCalled();
  });
});
