export interface StateSaver<T> {
    save<T>(key: string, state: T): Promise<void>;
    load<T>(key: string): Promise<T>;
}