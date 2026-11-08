import { getGlobalContext } from "@/types/context";
import axios from "axios";

export const apiClient = axios.create({
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  },
});

apiClient.interceptors.request.use((config) => {
  const { csrfToken } = getGlobalContext();
  if (csrfToken && config.headers) {
    config.headers["X-CSRFToken"] = csrfToken;
  }
  return config;
});
