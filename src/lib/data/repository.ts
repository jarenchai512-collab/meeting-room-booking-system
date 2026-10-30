import { IDataSource } from "./data-source.interface";
import { GoogleSheetsDataSource } from "./google-sheets";
import { LocalStoreDataSource } from "./local-store";

class DataRepository {
  private instance: IDataSource | null = null;

  async getDataSource(): Promise<IDataSource> {
    if (this.instance) return this.instance;

    const useGoogleSheets = process.env.USE_GOOGLE_SHEETS === "true";
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (useGoogleSheets && sheetId && clientEmail && privateKey) {
      try {
        const googleDs = new GoogleSheetsDataSource(sheetId, clientEmail, privateKey);
        await googleDs.init();
        console.log("Successfully initialized Google Sheets Data Source:", sheetId);
        this.instance = googleDs;
        return this.instance;
      } catch (err: any) {
        console.warn(
          "Failed to initialize Google Sheets, falling back to Local Store:",
          err?.message
        );
      }
    }

    const localDs = new LocalStoreDataSource();
    await localDs.init();
    this.instance = localDs;
    return this.instance;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __dataRepository: DataRepository | undefined;
}

export const repository =
  globalThis.__dataRepository || (globalThis.__dataRepository = new DataRepository());

export async function getDb(): Promise<IDataSource> {
  return repository.getDataSource();
}
