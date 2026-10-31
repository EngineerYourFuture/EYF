/** UI identity survives edits and reordering; symbols stay out of JSON payloads. */
export const editorId = Symbol("editorId");
export type EditorRow<T> = T & { [editorId]: string };

export function editorRow<T extends object>(value: T): EditorRow<T> {
  const id = editorId in value && typeof value[editorId] === "string" ? value[editorId] : crypto.randomUUID();
  return { ...value, [editorId]: id };
}
