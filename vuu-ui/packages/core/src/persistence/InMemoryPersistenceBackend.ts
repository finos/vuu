import {
  type DeleteOptions,
  type DocumentRef,
  type DocumentSummary,
  type PersistenceBackend,
  PersistenceConflictError,
  summarizeDocument,
} from "./PersistenceBackend";
import {
  type StateDocument,
  cloneStateDocument,
  storageSize,
  validateStateDocument,
} from "./StateDocument";

const documentId = ({
  applicationKey,
  applicationVersion,
  user,
}: DocumentRef) => JSON.stringify([user, applicationKey, applicationVersion]);

export interface InMemoryPersistenceBackendProps {
  /** Documents to start with, e.g. fixtures in tests or the showcase. */
  documents?: readonly StateDocument[];
}

/**
 * Keeps state documents in memory only. For tests, the showcase, and portals
 * that don't want saved state to outlive the page.
 */
export class InMemoryPersistenceBackend implements PersistenceBackend {
  #documents = new Map<string, string>();

  constructor({ documents = [] }: InMemoryPersistenceBackendProps = {}) {
    for (const document of documents) {
      this.#documents.set(
        documentId(document),
        JSON.stringify(validateStateDocument(document)),
      );
    }
  }

  #read(ref: DocumentRef) {
    const json = this.#documents.get(documentId(ref));
    return json === undefined ? undefined : (JSON.parse(json) as StateDocument);
  }

  async load(ref: DocumentRef) {
    return this.#read(ref);
  }

  async save(doc: StateDocument, expectedRevision?: number) {
    validateStateDocument(doc);
    const current = this.#read(doc);
    const currentRevision = current?.revision ?? 0;
    if (
      expectedRevision !== undefined &&
      expectedRevision !== currentRevision
    ) {
      throw new PersistenceConflictError(doc, current);
    }
    const revision = currentRevision + 1;
    const saved = { ...cloneStateDocument(doc), revision };
    this.#documents.set(documentId(doc), JSON.stringify(saved));
    return { revision };
  }

  async delete(ref: DocumentRef, options?: DeleteOptions) {
    if (options?.unreadable !== true) {
      this.#documents.delete(documentId(ref));
    }
  }

  async list(user: string): Promise<readonly DocumentSummary[]> {
    const summaries: DocumentSummary[] = [];
    for (const json of this.#documents.values()) {
      const document = JSON.parse(json) as StateDocument;
      if (document.user === user) {
        summaries.push(summarizeDocument(document, storageSize(json)));
      }
    }
    return summaries;
  }
}
