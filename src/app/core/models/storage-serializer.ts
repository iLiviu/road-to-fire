/**
 * Provide an interface for serializing/unserializing objects when
 * adding/getting them from storage
 */
export interface StorageSerializer {
  /**
   * Returns a serialized version of the data
   * @param data data to serialize
   */
  serialize(obj: any): any;

  /**
   * Return unserialized version of the data
   * @param data data to unserialize
   */
  unserialize(obj: any): any;
}

/**
 * Implement a default serializer that only returns the same reference
 * to the data it was provided, without altering it
 */
export class DefaultStorageSerializer implements StorageSerializer {

  serialize(data: any): any {
    return data;
  }

  unserialize(data: any): any {
    return data;
  }


}
