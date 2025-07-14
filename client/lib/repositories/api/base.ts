import type { BaseRepository, RepositoryConfig } from "../interfaces";

export abstract class ApiBaseRepository<T extends { id: string }, TCreate>
  implements BaseRepository<T, TCreate>
{
  protected baseUrl: string;
  protected endpoint: string;
  protected headers: Record<string, string>;

  constructor(config: RepositoryConfig, endpoint: string) {
    this.baseUrl = config.apiBaseUrl || "/api";
    this.endpoint = endpoint;
    this.headers = {
      "Content-Type": "application/json",
      ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
    };
  }

  private async request<TResponse>(
    path: string,
    options: RequestInit = {},
  ): Promise<TResponse> {
    const url = `${this.baseUrl}${this.endpoint}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getAll(): Promise<T[]> {
    return this.request<T[]>("");
  }

  async getById(id: string): Promise<T | null> {
    try {
      return await this.request<T>(`/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async create(data: TCreate): Promise<T> {
    return this.request<T>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: Partial<TCreate>): Promise<T> {
    return this.request<T>(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<void> {
    await this.request<void>(`/${id}`, {
      method: "DELETE",
    });
  }

  protected async requestArray<TResponse>(
    path: string,
    options: RequestInit = {},
  ): Promise<TResponse[]> {
    return this.request<TResponse[]>(path, options);
  }

  protected async requestSingle<TResponse>(
    path: string,
    options: RequestInit = {},
  ): Promise<TResponse> {
    return this.request<TResponse>(path, options);
  }

  protected buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString() ? `?${searchParams.toString()}` : "";
  }
}
