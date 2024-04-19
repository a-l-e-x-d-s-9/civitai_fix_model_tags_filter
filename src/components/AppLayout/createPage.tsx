import { NextPage } from 'next';
import React, { ReactElement } from 'react';

export type InnerLayoutOptions = {
  innerLayout: (page: { children: React.ReactNode }) => JSX.Element;
  withScrollArea?: boolean;
};

export type OuterLayoutOptions = {
  layout: (page: { children: React.ReactNode }) => JSX.Element;
};
type CreatePageOptions = InnerLayoutOptions | OuterLayoutOptions;

export type CustomNextPage = NextPage & {
  getLayout?: (page: ReactElement) => JSX.Element;
  options?: InnerLayoutOptions;
};

export function createPage(Component: CustomNextPage, options?: CreatePageOptions) {
  if (options) {
    if ('layout' in options) {
      const Elem = options.layout;
      Component.getLayout = (page: ReactElement) => <Elem>{page}</Elem>;
    } else {
      Component.options = options;
    }
  }

  return Component;
}
