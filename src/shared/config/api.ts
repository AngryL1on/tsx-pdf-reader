const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const getApiBaseUrl = (): string => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  return trimTrailingSlash(fromEnv && fromEnv.length > 0 ? fromEnv : '/api');
};
