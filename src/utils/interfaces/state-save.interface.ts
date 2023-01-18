export interface StateSaver<T> {
    save(key: string, state: T): Promise<void>;
    load(key: string): Promise<T>;
    remove(key:string): Promise<void>
}