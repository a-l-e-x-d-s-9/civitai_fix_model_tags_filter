// src/utils/trpc.ts
import { QueryClient } from '@tanstack/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import { createTRPCNext } from '@trpc/next';
import superjson from 'superjson';
import type { AppRouter } from '~/server/routers';
import { isDev } from '~/env/other';

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      queryClient: new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
            staleTime: Infinity,
          },
        },
      }),
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) => isDev || (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `/api/trpc`,
          maxURLLength: 2083,
        }),
      ],
    };
  },
  ssr: false,
});
