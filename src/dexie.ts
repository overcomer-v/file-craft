import {Dexie} from "dexie";

export const db:any = new Dexie("FileDB");

db.version(1).stores({
  files: "++id, order,sessionId"
});