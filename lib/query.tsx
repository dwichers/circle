'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect } from 'react';

export const queryClient = new QueryClient();

export function QueryProvider({ children }: { children: ReactNode }) {
   useEffect(() => {
      const url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
      const ws = new WebSocket(url);
      ws.addEventListener('message', (event) => {
         try {
            const data = JSON.parse(event.data);
            if (data.event === 'tasks.updated') {
               queryClient.invalidateQueries({ queryKey: ['tasks'] });
            }
         } catch (e) {
            console.error(e);
         }
      });
      return () => ws.close();
   }, []);

   return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
