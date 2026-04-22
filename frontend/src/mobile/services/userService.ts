import { apiClient } from "./api";

export async function createGuestSession(timezone: string, reminderTime?: string) {
  const response = await apiClient.post("/users/guest/session", {
    timezone,
    locale: "en",
    reminder_time: reminderTime,
  });
  return response.data as {
    user: {
      id: string;
      timezone: string;
    };
    tokens: {
      access_token: string;
      refresh_token: string;
    };
  };
}

export async function signInWithGoogleIdToken(idToken: string) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const response = await apiClient.post("/users/google/session", {
    id_token: idToken,
    timezone,
    locale: "en",
  });
  return response.data as {
    user: {
      id: string;
      timezone: string;
    };
    tokens: {
      access_token: string;
      refresh_token: string;
    };
  };
}

export async function linkGoogleIdToken(idToken: string) {
  const response = await apiClient.post("/users/link/google", { id_token: idToken });
  return response.data as {
    user: {
      id: string;
      timezone: string;
    };
    tokens: {
      access_token: string;
      refresh_token: string;
    };
  };
}

export async function refreshSession(refreshToken: string) {
  const response = await apiClient.post("/users/refresh", { refresh_token: refreshToken });
  return response.data as {
    access_token: string;
    refresh_token: string;
  };
}

export async function logoutSession(refreshToken: string) {
  await apiClient.post("/users/logout", { refresh_token: refreshToken });
}

export async function deleteMyAccount() {
  await apiClient.delete("/users/me");
}

export async function fetchMe() {
  const response = await apiClient.get("/users/me");
  return response.data as {
    user: {
      id: string;
      auth_provider: string;
      email_nullable: string | null;
      timezone: string;
      locale: string;
      reminder_time: string | null;
      notifications_enabled: boolean;
    };
  };
}
