import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  insertData: (table: any, data: any) =>
    ipcRenderer.invoke("insert-data", table, data),
  queryData: (sql: any, params: any) =>
    ipcRenderer.invoke("query-data", sql, params),
  detectPrinters: () => ipcRenderer.invoke("detect-all-printers"),
  printPdf: (filePath: any, printerName: any) =>
    ipcRenderer.invoke("print-pdf", filePath, printerName),
  selectFile: () => ipcRenderer.invoke("select-file"), // Expose file selection
  uploadFile: (event: any, selectFormat: any) =>
    ipcRenderer.invoke("upload-file", event, selectFormat),
  uploadImage: (event:any, filePath: string) =>
    ipcRenderer.invoke("upload-file-image", event, filePath),
  uploadPDF: (arrayBuffer: any, name: any) =>
    ipcRenderer.invoke("upload-generated-pdf", arrayBuffer, name),
  fetchUploadedFiles: () => ipcRenderer.invoke("fetch-uploaded-files"),
  fetchUploadedFile: (name: any) =>
    ipcRenderer.invoke("fetch-uploaded-file", name),
  fetchUploadedPDFFile: (name: any) =>
    ipcRenderer.invoke("fetch-uploaded-pdf-file", name),

  deleteFile: (filePath: any) => ipcRenderer.invoke("delete-file", filePath),
  getTemplates: () => ipcRenderer.invoke("get-templates"),
  AddTemplates: (event: any, template: any) =>
    ipcRenderer.invoke("add-template", template),
  updateTemplates: (event: any, name: any) =>
    ipcRenderer.invoke("update-template", name),
  deleteTemplates: (event: any, name: any) =>
    ipcRenderer.invoke("delete-template", name),

  getPrinterStatus: (printerName: any) =>
    ipcRenderer.invoke("get-printer-status", printerName),
  send: (channel: any, data: any) => {
    // Whitelist channels
    const validChannels = [
      "authenticate-user",
      "add-country",
      "get-countries",
      "delete-country",
      "add-bank",
      "get-banks",
      "delete-bank",
      "add-agency",
      "get-agencies",
      "delete-agency",
      "delete-countries",
      "delete-agencies",
      "delete-banks",
      "add-template",
      "get-template",
      "delete-templates",
      "get-template-byId",
      "update-template-byId",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel: any, func: any) => {
    // Whitelist channels
    const validChannels = [
      "authentication-result",
      "countries-loaded",
      "banks-loaded",
      "agencies-loaded",
      "templates-loaded",
      "template-byId-loaded",
      "template-updated",
      "bank-added",
      "bank-deleted",
      "banks-deleted",
      "agencies-deleted",
      "agency-deleted",
      "agency-added",
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  off: (channel: any) => {
    ipcRenderer.removeAllListeners(channel); // Remove all listeners for the channel
  },
});
