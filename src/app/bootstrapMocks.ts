let mockingStarted = false;

export const bootstrapMocks = async () => {
  if (!import.meta.env.DEV || mockingStarted) {
    return;
  }
  mockingStarted = true;
  const { worker } = await import('@/shared/mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  });
};
