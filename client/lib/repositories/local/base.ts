import type { BaseRepository } from "../interfaces";

export abstract class LocalStorageBaseRepository<
  T extends { id: string },
  TCreate,
> implements BaseRepository<T, TCreate>
{
  protected storageKey: string;
  protected defaultData: T[];

  constructor(storageKey: string, defaultData: T[] = []) {
    this.storageKey = storageKey;
    this.defaultData = defaultData;
  }

  protected generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  protected loadFromStorage(): T[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [...this.defaultData];
    } catch (error) {
      console.warn(
        `Failed to load ${this.storageKey} from localStorage:`,
        error,
      );
      return [...this.defaultData];
    }
  }

  protected saveToStorage(data: T[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error(
        `Failed to save ${this.storageKey} to localStorage:`,
        error,
      );
      throw new Error(`Failed to save data to local storage`);
    }
  }

  protected simulateNetworkDelay(): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, 100 + Math.random() * 200),
    );
  }

  async getAll(): Promise<T[]> {
    await this.simulateNetworkDelay();
    return this.loadFromStorage();
  }

  async getById(id: string): Promise<T | null> {
    await this.simulateNetworkDelay();
    const items = this.loadFromStorage();
    return items.find((item) => item.id === id) || null;
  }

  async create(data: TCreate): Promise<T> {
    await this.simulateNetworkDelay();
    const items = this.loadFromStorage();
    const now = new Date().toISOString();
    const newItem = {
      ...data,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    } as T;

    items.push(newItem);
    this.saveToStorage(items);
    return newItem;
  }

  async update(id: string, data: Partial<TCreate>): Promise<T> {
    await this.simulateNetworkDelay();
    const items = this.loadFromStorage();
    const index = items.findIndex((item) => item.id === id);

    if (index === -1) {
      throw new Error(`Item with id ${id} not found`);
    }

    const updatedItem = {
      ...items[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    items[index] = updatedItem;
    this.saveToStorage(items);
    return updatedItem;
  }

  async delete(id: string): Promise<void> {
    await this.simulateNetworkDelay();
    const items = this.loadFromStorage();
    const filteredItems = items.filter((item) => item.id !== id);

    if (filteredItems.length === items.length) {
      throw new Error(`Item with id ${id} not found`);
    }

    this.saveToStorage(filteredItems);
  }

  protected findByField<K extends keyof T>(
    field: K,
    value: T[K],
  ): Promise<T[]> {
    return this.getAll().then((items) =>
      items.filter((item) => item[field] === value),
    );
  }

  protected searchByFields<K extends keyof T>(
    fields: K[],
    query: string,
  ): Promise<T[]> {
    return this.getAll().then((items) => {
      const lowercaseQuery = query.toLowerCase();
      return items.filter((item) =>
        fields.some((field) => {
          const value = item[field];
          return (
            typeof value === "string" &&
            value.toLowerCase().includes(lowercaseQuery)
          );
        }),
      );
    });
  }

  protected filterByDateRange(
    items: T[],
    startDate: string,
    endDate: string,
    dateField: keyof T,
  ): T[] {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return items.filter((item) => {
      const itemDate = new Date(item[dateField] as string);
      return itemDate >= start && itemDate <= end;
    });
  }

  clearStorage(): void {
    localStorage.removeItem(this.storageKey);
  }

  seedData(data: T[]): void {
    this.saveToStorage(data);
  }
}
