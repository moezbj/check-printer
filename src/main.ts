/* eslint-disable no-inner-declarations */
import { app, BrowserWindow, ipcMain, dialog, Menu } from "electron";
import { IpcMainEvent } from "electron/main";
import path from "path";

import XLSX from "xlsx";
import sqlite3 from "better-sqlite3";

// Define types for better type safety
interface PrinterStatus {
  isActive?: boolean;
  status?: string;
  error?: string;
  name?: string;
  detectedError?: string;
  inkLevels?: string;
}

interface FileObject {
  name: string;
  path: string;
}
interface ExcelRow {
  NUMERO_COMPTE: string;
  CODE_AGENCE: string;
  NOMBRE_CARNET: string;
  NOMBRE_FEULLE: string;
  CODE_TRANSACTION: string;
  NOM_CLIENT: string;
  ADR_CLIENT: string;
  CODE_BANQUE: string;
  CODE_PAYS: string;
  NUMERO_DEBUT_CHEQUE: string;
  NUMERO_FIN_CHEQUE: string;
  RIB?: string;
  CMC7?: string;
}

interface UploadFileResponse {
  success: boolean;
  message?: string;
  error?: string;
  filePath?: string;
  data?: ExcelRow[];
}
interface PrintResult {
  success: boolean;
  message?: string;
  error?: string;
  file?: string;
}

interface PrintPdfResponse {
  success: boolean;
  message?: string;
  error?: string;
  results?: PrintResult[];
}
interface UploadGeneratedPdfResponse {
  success: boolean;
  message?: string;
  error?: string;
  filePath?: string;
}
interface FetchUploadedFileResponse {
  success: boolean;
  message?: string;
  filePath?: string;
  data?: ExcelRow[];
  error?: string;
}
interface FetchUploadedPdfFileResponse {
  success: boolean;
  message?: string;
  filePath?: string;
  error?: string;
}
interface PrinterStatusResponse {
  name?: string;
  status?: string;
  detectedError?: string;
  inkLevels?: string;
  error?: string;
}

interface ParsedOutput {
  Name: string;
  PrinterStatus: number; // Ensure this is a number
  DetectedErrorState: string;
  InkLevels: string;
}
import { exec } from "child_process";
import util from "util";
const execWithTimeout = util.promisify(exec);

import fs from "fs";

import { getFormattedDate } from "./lib/formatDate";
import { addFormattedDateToFileName } from "./lib/addDateToName";
import { isExistFile } from "../test";

// Define the uploads path
const uploadDir = path.join(app.getPath("userData"), "uploads");
// Define the database path
const dbPath = path.join(app.getPath("userData"), "database", "database.db");
// Ensure the database directory exists
const dir = path.dirname(dbPath);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
let db: sqlite3.Database;

try {
  // Open the database connection
  db = sqlite3(dbPath);
  console.log(`Database opened successfully at: ${dbPath}`);

  // Function to initialize the database
  function initializeDatabase() {
    try {
      // Create tables if they don't exist
      const createTablesQuery = `
        CREATE TABLE IF NOT EXISTS bank (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            idbank TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL UNIQUE,
            country_name TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS agency (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            idagency TEXT NOT NULL,
            name TEXT NOT NULL,
            bank_id INTEGER,
            FOREIGN KEY (bank_id) REFERENCES bank(id)
        );
        CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            image TEXT NOT NULL,
            imageStatement TEXT,
            imageReception TEXT,
            imageRib TEXT,
            fields TEXT NOT NULL,
            rib TEXT,
            accused TEXT,
            statement TEXT,
            demand TEXT,
            format TEXT NOT NULL,
            bank_id INTEGER,
            FOREIGN KEY (bank_id) REFERENCES bank(id)
        );
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        );
      `;

      // Execute the table creation query
      db.exec(createTablesQuery);

      // Insert default admin user if not already present
      const insertAdminUser = db.prepare(`
        INSERT OR IGNORE INTO users (name, email, password, role)
        VALUES ('admin', 'admin@example.com', 'admin123', 'admin');
      `);
      insertAdminUser.run();

      const insertSimpleUser = db.prepare(`
        INSERT OR IGNORE INTO users (name, email, password, role)
        VALUES ('simpleUser', 'user@example.com', 'password123', 'user');
      `);
      insertSimpleUser.run();

      // Check if the default bank already exists
      const checkBankExists = db.prepare(`
        SELECT id FROM bank WHERE idbank = ?;
    `);
      const bankExists = checkBankExists.get("1"); // Assuming idbank = 1 for the default bank
      if (!bankExists) {
        // Insert default bank if it doesn't exist
        const insertBank = db.prepare(`
            INSERT INTO bank (idbank, name, country_name) VALUES ('1', 'Default Bank', 'tunisia');
        `);
        insertBank.run();
      }
      // default template
      const stmt = db.prepare(`
        INSERT INTO templates (
            name, image, imageStatement, imageReception, imageRib, fields, rib, accused, statement, demand, format, bank_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
      // Execute the statement with default values
      stmt.run(
        "test", // name
        "Default Image", // image
        "Default Image Statement", // imageStatement
        "Default Image Reception", // imageReception
        "Default Image Rib", // imageRib
        '[{"nom":"NUMERO_COMPTE","x":452,"y":178},{"nom":"NOMBRE_CARNET","x":92,"y":13},{"nom":"CODE_AGENCE","x":415,"y":178},{"nom":"CODE_BANQUE","x":378,"y":178},{"nom":"series","x":618,"y":18},{"nom":"CMC7","x":294,"y":236},{"nom":"RIB","x":612,"y":178},{"nom":"ADR_CLIENT","x":250,"y":178}]', // fields
        '[{"nom":"NOM_CLIENT","x":230,"y":202},{"nom":"NUMERO_COMPTE","x":480,"y":202},{"nom":"CODE_AGENCE","x":438,"y":202},{"nom":"CODE_BANQUE","x":375,"y":202},{"nom":"RIB","x":576,"y":202}]', // rib
        '[{"nom":"NOM_CLIENT","x":230,"y":202},{"nom":"NUMERO_COMPTE","x":480,"y":202},{"nom":"CODE_AGENCE","x":438,"y":202},{"nom":"CODE_BANQUE","x":375,"y":202},{"nom":"RIB","x":576,"y":202}]', // accused
        '[{"nom":"NOM_CLIENT","x":274,"y":212},{"nom":"NUMERO_COMPTE","x":450,"y":212},{"nom":"CODE_AGENCE","x":390,"y":212},{"nom":"CODE_BANQUE","x":340,"y":212},{"nom":"RIB","x":556,"y":212}]',
        "Default Demand", // demand
        "PF", // format
        1, // bank_id
      );

      console.log("Database initialized successfully.");
    } catch (error) {
      console.error("Error initializing database:", error.message);
      throw error;
    }
  }
  // Initialize the database
  initializeDatabase();
  console.log("Database setup completed. Ready for login.");
} catch (error) {
  console.error("Error opening or initializing database:", error.message);
}

let mainWindow: BrowserWindow | null = null;
let loadingWindow: BrowserWindow | null = null;
function createWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true, // Enable Node.js integration
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // Open the DevTools only in dev mode.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadDir}`);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.once("ready-to-show", () => {
    if (loadingWindow) {
      loadingWindow.close(); // Close the loading window
    }
    mainWindow.show();
    mainWindow.maximize(); // Show the main window
  });
}
// create loading window
function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false, // Optional: Remove borders for a cleaner look
    alwaysOnTop: true, // Keep the loading screen on top
    backgroundColor: "#f0f0f0", // Match the background color with the loading screen
    show: true, // Show the loading window immediately
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    // Load the loading screen HTML
    // Resolve the correct path to loading.html
    const loadingPath = path.join(app.getAppPath(), "public/loading.html");
    loadingWindow.loadFile(loadingPath);
  } else {
    const loadingPath  =  path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/loading.html`);
    loadingWindow.loadFile(loadingPath);
  }
}
//detect prints
ipcMain.handle("detect-all-printers", async (): Promise<string[]> => {
  const platform = process.platform;
  let command: string;

  if (platform === "win32") {
    command = "wmic printer get name";
  } else if (platform === "darwin" || platform === "linux") {
    command = "lpstat -p";
  } else {
    throw new Error("Unsupported platform");
  }

  console.log(`Executing command: ${command}`);
  const { stdout, stderr } = await execWithTimeout(command);

  if (stderr) {
    console.error("Stderr:", stderr);
    throw new Error(stderr);
  }

  return parsePrinterOutput(stdout, platform);
});
// get status of a printer
ipcMain.handle(
  "get-printer-status",
  async (event: IpcMainEvent, printerName: string): Promise<PrinterStatus> => {
    const platform = process.platform;
    let command: string;

    if (platform === "win32") {
      command = `powershell.exe -Command "Get-Printer -Name '${printerName}' | Select-Object Name, PrinterStatus, DetectedErrorState, InkLevels | ConvertTo-Json"`;
    } else if (platform === "darwin" || platform === "linux") {
      command = `lpstat -p "${printerName}" && lpstat -t`;
    } else {
      throw new Error("Unsupported platform");
    }

    console.log(`Executing command: ${command}`);
    const { stdout, stderr } = await execWithTimeout(command);

    if (stderr) {
      console.error("Stderr:", stderr);
      throw new Error(stderr);
    }

    return parsePrinterStatus(stdout, platform);
  },
);
// print function
ipcMain.handle(
  "print-pdf",
  async (
    event: IpcMainEvent,
    filesPath: string,
    printerName: string,
  ): Promise<PrintPdfResponse> => {
    const platform = process.platform;
    console.log("filePath", filesPath);

    const files = filesPath.split(";");
    console.log(files);

    try {
      // Validate file paths
      files.forEach((filePath: string) => {
        if (!fs.existsSync(filePath)) {
          console.error(`File not found: ${filePath}`);
          throw new Error(`File not found: ${filePath}`);
        }
      });

      // Validate printer name
      if (!printerName) {
        throw new Error("Printer name is required.");
      }

      const results: PrintResult[] = [];
      let result: PrintResult;

      if (platform === "darwin" || platform === "linux") {
        for (const filePath of files) {
          console.log(`Processing file: ${filePath}`);
          const command = `lp -d "${printerName}" "${filePath}"`;
          console.log(`Executing command: ${command}`);

          try {
            result = await new Promise<PrintResult>((resolve, reject) => {
              const childProcess = exec(command);

              const timeoutId = setTimeout(() => {
                console.log(`Command timed out for file: ${filePath}`);
                if (childProcess && childProcess.kill) {
                  childProcess.kill("SIGTERM"); // Explicitly send a termination signal
                }
                reject({
                  success: false,
                  error: "Command timed out.",
                  file: filePath,
                });
              }, 10000); // 10 seconds

              let stderrOutput = ""; // Capture stderr output
              let stdoutOutput = ""; // Capture stdout output

              childProcess.on("exit", (code: number | null) => {
                console.log(
                  `Process exited for file: ${filePath} with code: ${code}`,
                );
                clearTimeout(timeoutId); // Clear timeout if the process exits

                if (code !== 0) {
                  // Log error details if the exit code is non-zero
                  console.error(
                    `Error printing file: ${filePath}. Exit code: ${code}. Stderr: ${stderrOutput}`,
                  );
                  reject({
                    success: false,
                    error: `Printing failed with exit code ${code}. Stderr: ${stderrOutput}`,
                    file: filePath,
                  });
                } else {
                  console.log(`File printed successfully: ${filePath}`);
                  resolve({
                    success: true,
                    message: "File printed successfully.",
                    file: filePath,
                  });
                }
              });

              childProcess.on("error", (error: Error) => {
                console.error(
                  `Error executing command for file: ${filePath}`,
                  error.message,
                );
                reject({
                  success: false,
                  error: error.message,
                  file: filePath,
                });
              });

              childProcess.stderr.on("data", (data: string) => {
                stderrOutput += data.toString(); // Accumulate stderr output
                console.error(`Stderr for file: ${filePath}`, data.toString());
              });

              childProcess.stdout.on("data", (data: string) => {
                stdoutOutput += data.toString(); // Accumulate stdout output
                console.log(`Stdout for file: ${filePath}`, data.toString());
              });
            });

            results.push(result); // Store the result for each file
            console.log(`Result added for file: ${filePath}`);
          } catch (error: any) {
            console.error(`Failed to print file: ${filePath}`, error.message);
            results.push({
              success: false,
              error: error.message,
              file: filePath,
            });
          }
        }

        // Check if all files were printed successfully
        const allSuccessful = results.every((res) => res.success);
        console.log("allSuccessful", allSuccessful);

        if (allSuccessful) {
          return {
            success: true,
            message: "All files printed successfully.",
            results,
          };
        } else {
          return {
            success: false,
            message: "Some files failed to print.",
            results,
          };
        }
      } else if (platform === "win32") {
        // Create a temporary window for printing if one doesn't exist or isn't suitable
        const printWindow = new BrowserWindow({
          show: true,
          webPreferences: {
            // Any necessary webPreferences
          },
        });

        // Load the PDF
        await printWindow.loadURL(`file://${files[0]}`);

        // Print the PDF
        const printResult = await new Promise<PrintResult>((resolve) => {
          printWindow.webContents.on("did-finish-load", () => {
            printWindow.webContents.print(
              {
                silent: false,
                printBackground: true,
                deviceName: printerName,
              },
              (success: boolean, failureReason: string) => {
                if (!success) {
                  console.error("Print failed:", failureReason);
                  resolve({ success: false, error: failureReason });
                } else {
                  resolve({
                    success: true,
                    message: "File printed successfully.",
                  });
                }
                // Close the window after printing
                printWindow.close();
              },
            );
          });
        });

        results.push(printResult);
        return {
          success: printResult.success,
          message: printResult.message,
          results,
        };
      } else {
        throw new Error("Unsupported platform");
      }
    } catch (error: any) {
      console.error("Error in print-files handler:", error.message);
      return { success: false, error: error.message || error.toString() };
    }
  },
);
// Handle file selection
ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      { name: "PDF Files", extensions: ["pdf", "png", "jpeg", "jpg", "pdf"] }, // Restrict to PDF files
    ],
  });

  if (result.canceled || !result.filePaths.length) {
    return null; // No file selected
  }

  const filePath = result.filePaths[0];
  const fileName = path.basename(filePath);
  const destPath = path.join(uploadDir, fileName);

  // Check if a file with the same name already exists in the upload directory
  if (fs.existsSync(destPath)) {
    console.log(`File already exists: ${destPath}`);
    return {
      success: false,
      error: `le fichier "${fileName}" existe déjà.`,
    };
  }

  // Copy the file to the upload directory
  fs.copyFileSync(filePath, destPath);
  console.log(`File uploaded: ${destPath}`);

  return result.filePaths[0]; // Return the selected file path
});
// Handle file upload
ipcMain.handle(
  "upload-file",
  async (
    event: IpcMainEvent,
    selectFormat: string,
  ): Promise<UploadFileResponse> => {
    try {
      // Show the file dialog to select a file
      const result = await dialog.showOpenDialog(mainWindow!, {
        properties: ["openFile"],
        filters: [
          {
            name: "Microsoft Excel Files",
            extensions: ["xls", "xlsx"],
          },
        ],
      });

      // Check if the user canceled the dialog or no file was selected
      if (result.canceled || !result.filePaths.length) {
        return { success: false, message: "No file selected" };
      }

      const filePath = result.filePaths[0];
      const fileName = path.basename(filePath);
      const newFileName = addFormattedDateToFileName(fileName);
      const destPath = path.join(uploadDir, fileName);
      const newDestPath = path.join(uploadDir, newFileName);

      // Check if the file already exists
      const isExist = isExistFile(uploadDir, fileName, false);
      if (isExist.length) {
        return {
          success: false,
          error: `Le fichier "${fileName}" existe déjà.`,
        };
      }

      // Parse the Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Get the first sheet
      const worksheet = workbook.Sheets[sheetName];
      console.log("selectFormat", selectFormat);

      // Convert the worksheet to JSON
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Get raw data with headers

      // Extract column indices for required fields
      const headers: string[] = data[0]; // First row contains headers
      const fieldIndices: { [key: string]: number } = {
        NUMERO_COMPTE: headers.indexOf("NUMERO_COMPTE"),
        CODE_AGENCE: headers.indexOf("CODE_AGENCE"),
        NOMBRE_CARNET: headers.indexOf("NOMBRE_CARNET"),
        NOMBRE_FEULLE: headers.indexOf("NOMBRE_FEULLE"),
        CODE_TRANSACTION: headers.indexOf("CODE_TRANSACTION"),
        NOM_CLIENT: headers.indexOf("NOM_CLIENT"),
        ADR_CLIENT: headers.indexOf("ADR_CLIENT"),
        CODE_BANQUE: headers.indexOf("CODE_BANQUE"),
        CODE_PAYS: headers.indexOf("CODE_PAYS"),
        NUMERO_DEBUT_CHEQUE: headers.indexOf("NUMERO_DEBUT_CHEQUE"),
        NUMERO_FIN_CHEQUE: headers.indexOf("NUMERO_FIN_CHEQUE"),
      };

      // Check if all required columns exist
      const requiredColumns = [
        "NUMERO_COMPTE",
        "CODE_AGENCE",
        "NOMBRE_CARNET",
        "NOMBRE_FEULLE",
        "CODE_TRANSACTION",
        "NOM_CLIENT",
        "ADR_CLIENT",
        "CODE_BANQUE",
        "CODE_PAYS",
        "NUMERO_DEBUT_CHEQUE",
        "NUMERO_FIN_CHEQUE",
      ];

      const missingColumns = requiredColumns.filter(
        (col) => fieldIndices[col] === -1,
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `Missing required columns: ${missingColumns.join(", ")}`,
        );
      }

      // Helper function to validate fields
      function isValidField(value: any, type: string): boolean {
        if (value === null || value === undefined || value === "") {
          return false; // Disallow empty or null values
        }

        switch (type) {
          case "NUMERO_COMPTE":
            return /^\d{10}$/.test(value); // Exactly 10 digits
          case "CODE_AGENCE":
            return /^\d{3}$/.test(value); // Exactly 3 digits
          case "NOMBRE_CARNET":
            return /^[1-9]\d*$/.test(value); // Positive integer
          case "NOMBRE_FEULLE":
            return [1, 2, 3, 25, 50, 100].includes(Number(value)); // Must be 25, 50, or 100
          case "CODE_TRANSACTION":
            return ["01", "02", "03"].includes(value); // Must be 01, 02, or 03
          case "NOM_CLIENT":
            return typeof value === "string" && value.length <= 50; // Maximum 50 characters
          case "CODE_BANQUE":
            return /^\d{3}$/.test(value); // Exactly 3 digits
          case "CODE_PAYS":
            return /^\d{3}$/.test(value); // Exactly 3 digits
          case "NUMERO_DEBUT_CHEQUE":
          case "NUMERO_FIN_CHEQUE":
            return /^\d{8}$/.test(value); // Exactly 8 digits
          default:
            return true; // Allow other fields for now
        }
      }

      // Filter and map the data to extract required fields with validation
      const filteredData: ExcelRow[] = data.slice(1).reduce((result, row) => {
        function calculateCleRIB(row: any): string {
          const fullNumber =
            row[fieldIndices.CODE_BANQUE] +
            row[fieldIndices.CODE_AGENCE] +
            row[fieldIndices.NUMERO_COMPTE];
          const N = fullNumber * 100;
          const remainder = Number(N % 97);
          const cléControle = remainder === 0 ? 97 : 97 - remainder;
          return String(cléControle).padStart(2, "0");
        }

        function generateCMC7(row: any, CLE_RIB: string): string {
          return `S3${row.NUMERO_CHEQUE || "021"}S3${
            row[fieldIndices.CODE_AGENCE]
          }S5${row[fieldIndices.CODE_BANQUE]}S1${
            row[fieldIndices.NUMERO_COMPTE]
          }${CLE_RIB}S2`;
        }

        const rib = calculateCleRIB(row);
        const record: ExcelRow = {
          NUMERO_COMPTE: row[fieldIndices.NUMERO_COMPTE],
          CODE_AGENCE: row[fieldIndices.CODE_AGENCE],
          NOMBRE_CARNET: row[fieldIndices.NOMBRE_CARNET],
          NOMBRE_FEULLE: row[fieldIndices.NOMBRE_FEULLE],
          CODE_TRANSACTION: row[fieldIndices.CODE_TRANSACTION],
          NOM_CLIENT: row[fieldIndices.NOM_CLIENT],
          ADR_CLIENT: row[fieldIndices.ADR_CLIENT],
          CODE_BANQUE: row[fieldIndices.CODE_BANQUE],
          CODE_PAYS: row[fieldIndices.CODE_PAYS],
          NUMERO_DEBUT_CHEQUE: row[fieldIndices.NUMERO_DEBUT_CHEQUE],
          NUMERO_FIN_CHEQUE: row[fieldIndices.NUMERO_FIN_CHEQUE],
          RIB: rib,
          CMC7: generateCMC7(row, rib),
        };

        // Validate all required fields
        const errors: string[] = [];
        Object.entries(record).forEach(([key, value]) => {
          if (key in fieldIndices && !isValidField(value, key)) {
            errors.push(`Invalid value for ${key}: "${value}"`);
          }
        });

        if (errors.length > 0) {
          throw new Error(
            `Validation failed for row: ${JSON.stringify(
              row,
            )}\nErrors: ${errors.join(", ")}`,
          );
        }

        // Add the valid record to the result
        result.push(record);
        return result;
      }, [] as ExcelRow[]);

      if (filteredData.length > 0) {
        // Copy the file to the upload directory
        fs.copyFileSync(filePath, destPath);
        // Rename the copied file with the new name
        fs.renameSync(destPath, newDestPath);

        return {
          success: true,
          message: `File uploaded successfully: ${fileName}`,
          filePath: newDestPath,
          data: filteredData, // Send the extracted data back to the frontend
        };
      } else {
        return {
          success: false,
          message: "Error uploading file",
        };
      }
    } catch (error: any) {
      console.error("Error uploading file:", error.message);
      return { success: false, error: error.message };
    }
  },
);
// Handle image upload
ipcMain.handle("upload-file-image", async (event, imagePath) => {
  try {
    // Show the file dialog to select a file

    const filePath = imagePath;
    const fileName = path.basename(imagePath);

    const destPath = path.join(uploadDir, fileName);

    // Check if a file with the same name already exists in the upload directory
    const isExist = isExistFile(uploadDir, fileName, true);
    if (isExist.length) {
      return {
        success: false,
        error: `le fichier "${fileName}" existe déjà.`,
      };
    }
    // Copy the file to the upload directory
    fs.copyFileSync(filePath, destPath);
    return {
      success: true,
      message: `File uploaded successfully`,
      filePath: "",
    };
  } catch (error) {
    console.error("Error uploading file:", error.message);
    return { success: false, error: error.message };
  }
});
// Handle generated upload
ipcMain.handle(
  "upload-generated-pdf",
  async (
    event: IpcMainEvent,
    pdfData: ArrayBuffer | Uint8Array,
    name: string,
  ): Promise<UploadGeneratedPdfResponse> => {
    try {
      // Define the file name and destination path
      const fileName = `${name}${getFormattedDate()}.pdf`; // You can customize the name if needed
      const destPath = path.join(uploadDir, fileName);

      // Check if a file with the same name already exists in the upload directory
      if (fs.existsSync(destPath)) {
        console.log(`File already exists: ${destPath}`);
        return {
          success: false,
          error: `Le fichier "${fileName}" existe déjà.`,
        };
      }

      // Ensure pdfData is a Uint8Array
      const pdfUint8Array =
        pdfData instanceof ArrayBuffer ? new Uint8Array(pdfData) : pdfData;

      // Write the PDF data to the destination path
      fs.writeFileSync(destPath, pdfUint8Array);

      console.log(`Generated PDF saved: ${destPath}`);
      return {
        success: true,
        message: `PDF uploaded successfully: ${fileName}`,
        filePath: destPath,
      };
    } catch (error: any) {
      console.error("Error saving generated PDF:", error.message);
      return { success: false, error: error.message };
    }
  },
);
// Handle fetching uploaded files
ipcMain.handle("fetch-uploaded-files", async (event) => {
  try {
    // Read all files in the upload directory
    const files = fs.readdirSync(uploadDir);

    // Map files to objects with name and path
    const fileObjects = files
      .map((file) => ({
        name: file,
        path: path.join(uploadDir, file),
      }))
      .filter((file) => {
        // Filter by Excel file extensions
        return /\.(xlsx|xls|xlt|xlsm|xlam|csv|pdf)$/i.test(file.name);
      });
    return fileObjects;
  } catch (error) {
    console.error("Error fetching uploaded files:", error.message);
    return [];
  }
});
// Handle fetching uploaded file

ipcMain.handle(
  "fetch-uploaded-file",
  async (
    event: IpcMainEvent,
    filter?: string,
  ): Promise<FetchUploadedFileResponse> => {
    try {
      // Read all files in the upload directory
      const files = fs.readdirSync(uploadDir);

      // Map files to objects with name and path
      let fileObjects = files
        .map((file) => ({
          name: file,
          path: path.join(uploadDir, file),
        }))
        .filter((file) => {
          // Filter by Excel file extensions
          return /\.(xlsx|xls|xlt|xlsm|xlam|csv)$/i.test(file.name);
        });

      // Apply additional filtering by name if a filter is provided
      if (filter) {
        const nameFilter = filter.toLowerCase().trim(); // Normalize the filter
        fileObjects = fileObjects.filter((file) => {
          return file.name.toLowerCase().includes(nameFilter); // Filter by name
        });
      }

      if (fileObjects.length === 0) {
        return {
          success: false,
          error: "No matching files found.",
        };
      }

      // Parse the Excel file
      const workbook = XLSX.readFile(fileObjects[0].path);
      const sheetName = workbook.SheetNames[0]; // Get the first sheet
      const worksheet = workbook.Sheets[sheetName];

      // Convert the worksheet to JSON
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Get raw data with headers

      // Extract column indices for required fields
      const headers: string[] = data[0]; // First row contains headers
      const fieldIndices = {
        NUMERO_COMPTE: headers.indexOf("NUMERO_COMPTE"),
        CODE_AGENCE: headers.indexOf("CODE_AGENCE"),
        NOMBRE_CARNET: headers.indexOf("NOMBRE_CARNET"),
        NOMBRE_FEULLE: headers.indexOf("NOMBRE_FEULLE"),
        CODE_TRANSACTION: headers.indexOf("CODE_TRANSACTION"),
        NOM_CLIENT: headers.indexOf("NOM_CLIENT"),
        ADR_CLIENT: headers.indexOf("ADR_CLIENT"),
        CODE_BANQUE: headers.indexOf("CODE_BANQUE"),
        CODE_PAYS: headers.indexOf("CODE_PAYS"),
        NUMERO_DEBUT_CHEQUE: headers.indexOf("NUMERO_DEBUT_CHEQUE"),
        NUMERO_FIN_CHEQUE: headers.indexOf("NUMERO_FIN_CHEQUE"),
      };

      // Filter and map the data to extract required fields
      const filteredData: ExcelRow[] = data.slice(1).map((row) => {
        function calculateCleRIB(row: any): string {
          const fullNumber =
            row[fieldIndices.CODE_BANQUE] +
            row[fieldIndices.CODE_AGENCE] +
            row[fieldIndices.NUMERO_COMPTE];
          const N = fullNumber * 100;
          const remainder = Number(N % 97);
          const cléControle = remainder === 0 ? 97 : 97 - remainder;
          return String(cléControle).padStart(2, "0");
        }

        function generateCMC7(row: any, CLE_RIB: string): string {
          return `S3${row.NUMERO_CHEQUE || "021"}S3${
            row[fieldIndices.CODE_AGENCE]
          }S5${row[fieldIndices.CODE_BANQUE]}S1${
            row[fieldIndices.NUMERO_COMPTE]
          }${CLE_RIB}S2`;
        }

        const rib = calculateCleRIB(row);

        return {
          NUMERO_COMPTE: row[fieldIndices.NUMERO_COMPTE],
          CODE_AGENCE: row[fieldIndices.CODE_AGENCE],
          NOMBRE_CARNET: row[fieldIndices.NOMBRE_CARNET],
          NOMBRE_FEULLE: row[fieldIndices.NOMBRE_FEULLE],
          CODE_TRANSACTION: row[fieldIndices.CODE_TRANSACTION],
          NOM_CLIENT: row[fieldIndices.NOM_CLIENT],
          ADR_CLIENT: row[fieldIndices.ADR_CLIENT],
          CODE_BANQUE: row[fieldIndices.CODE_BANQUE],
          CODE_PAYS: row[fieldIndices.CODE_PAYS],
          NUMERO_DEBUT_CHEQUE: row[fieldIndices.NUMERO_DEBUT_CHEQUE],
          NUMERO_FIN_CHEQUE: row[fieldIndices.NUMERO_FIN_CHEQUE],
          RIB: rib,
          CMC7: generateCMC7(row, rib),
        };
      });

      return {
        success: true,
        message: "File fetched successfully",
        filePath: fileObjects[0].path,
        data: filteredData, // Send the extracted data back to the frontend
      };
    } catch (error: any) {
      console.error("Error fetching uploaded files:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
);
// Handle fetching uploaded pdf file
ipcMain.handle(
  "fetch-uploaded-pdf-file",
  async (
    event: IpcMainEvent,
    filter?: string,
  ): Promise<FetchUploadedPdfFileResponse> => {
    try {
      // Read all files in the upload directory
      const files = fs.readdirSync(uploadDir);

      // Map files to objects with name and path
      const fileObjects: FileObject[] = files
        .map((file) => ({
          name: file,
          path: path.join(uploadDir, file),
        }))
        .filter((file) => {
          // Filter by PDF file extensions
          return /\.(pdf)$/i.test(file.name);
        });

      // Apply additional filtering by name if a filter is provided
      if (filter) {
        const nameFilter = filter.toLowerCase().trim(); // Normalize the filter
        const filteredFile = fileObjects.find((file) => {
          return file.name.toLowerCase().includes(nameFilter); // Filter by name
        });

        if (!filteredFile) {
          return {
            success: false,
            error: "No matching PDF file found.",
          };
        }

        return {
          success: true,
          message: "File fetched successfully",
          filePath: filteredFile.path,
        };
      }

      // If no filter is provided, return the first PDF file (if any)
      if (fileObjects.length === 0) {
        return {
          success: false,
          error: "No PDF files found in the upload directory.",
        };
      }

      return {
        success: true,
        message: "File fetched successfully",
        filePath: fileObjects[0].path,
      };
    } catch (error: any) {
      console.error("Error fetching uploaded PDF files:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },
);
// Handle delete file
ipcMain.handle("delete-file", (event, filePath) => {
  try {
    fs.unlinkSync(filePath);
    return { success: true, message: "FILE_DELETED" };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  createLoadingWindow();
  // Simulate some asynchronous task (e.g., fetching data)
  setTimeout(() => {
    // Step 2: Create the main window after the task is done
    createWindow();
  }, 1300);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createLoadingWindow();
  }
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Communication
/* ipcMain.handle("insert-data", async (event, table, data) => {
  const columns = Object.keys(data).join(", ");
  const placeholders = Object.keys(data)
    .map(() => "?")
    .join(", ");
  const values = Object.values(data);

  const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
  const stmt = db.prepare(sql);
  const result = stmt.run(values);
  return result.lastInsertRowid;
});

ipcMain.handle("query-data", async (event, sql, params) => {
  const stmt = db.prepare(sql);
  const rows = params ? stmt.all(params) : stmt.all();
  return rows;
}); */
// add bank
ipcMain.on("add-bank", (event, data) => {
  db.prepare(
    "INSERT INTO bank (name, country_name, idbank) VALUES (?, ?, ?)",
  ).run(data.name, data.country, data.idbank);
  event.reply("bank-added");
});
// get banks
ipcMain.on("get-banks", (event) => {
  const rows = db.prepare(`SELECT * FROM bank`).all();
  event.reply("banks-loaded", rows);
});
// delete bank
ipcMain.on("delete-bank", (event, id) => {
  db.prepare("DELETE FROM bank WHERE id = ?").run(id);
  event.reply("bank-deleted");
});
// delete banks
ipcMain.on("delete-banks", (event, ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    console.error("Invalid input for bulk deletion:", ids);
    event.reply("banks-deleted");

    return;
  }

  // Create placeholders for the IDs (e.g., "?, ?, ?")
  const placeholders = ids.map(() => "?").join(", ");

  // Prepare and execute the query
  db.prepare(`DELETE FROM bank WHERE id IN (${placeholders})`).run(ids);
});

ipcMain.on("add-agency", (event, data) => {
  db.prepare(
    "INSERT INTO agency (name, bank_id, idagency) VALUES (?, ?, ?)",
  ).run(data.name, data.bankId, data.idagency);
  event.reply("agency-added");
});

ipcMain.on("get-agencies", (event) => {
  const rows = db
    .prepare(
      `
    SELECT a.id, a.idagency, a.name, b.name AS bank_name
    FROM agency a
    JOIN bank b ON a.bank_id = b.id
  `,
    )
    .all();
  event.reply("agencies-loaded", rows);
});

ipcMain.on("delete-agency", (event, id) => {
  db.prepare("DELETE FROM agency WHERE id = ?").run(id);
  event.reply("agency-deleted");
});
ipcMain.on("delete-agencies", (event, ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    console.error("Invalid input for bulk deletion:", ids);
    event.reply("agencies-deleted");
    return;
  }

  // Create placeholders for the IDs (e.g., "?, ?, ?")
  const placeholders = ids.map(() => "?").join(", ");

  // Prepare and execute the query
  db.prepare(`DELETE FROM agency WHERE id IN (${placeholders})`).run(ids);
  event.reply("agencies-deleted");
});

ipcMain.on("add-template", (event, data) => {
  db.prepare(
    "INSERT INTO templates (name, image, imageStatement,imageReception,imageRib, fields, accused, statement, format, demand, rib, bank_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ? ,?, ?)",
  ).run(
    data.name,
    data.image,
    data.imageStatement,
    data.imageReception,
    data.imageRib,
    data.fields,
    data.accused,
    data.statement,
    data.format,
    data.demand,
    data.rib,
    data.bank_id,
  );
});

ipcMain.on("get-template", (event) => {
  const rows = db
    .prepare(
      `
SELECT templates.*, bank.name AS bank_name
FROM templates
JOIN bank ON templates.bank_id = bank.id;
  `,
    )
    .all();
  event.reply("templates-loaded", rows);
});
ipcMain.on("get-template-byId", (event, id) => {
  const rows = db.prepare(
    `
    SELECT templates.*, bank.name AS bank_name
FROM templates
JOIN bank ON templates.bank_id = bank.id
    WHERE templates.id = ?
  `,
  );
  const template = rows.get(id); // Fetch the template by ID

  event.reply("template-byId-loaded", template);
});
ipcMain.on("update-template-byId", (event, data) => {
  try {
    const { id, updatedData } = data;

    if (!id || !updatedData) {
      event.reply("template-updated", {
        success: false,
        message: "Invalid request. Missing ID or updatedData.",
      });
      return;
    }

    // Extract column names and values from updatedData
    const columns = Object.keys(updatedData)
      .map((key) => `"${key}" = ?`)
      .join(", ");
    const values = Object.values(updatedData);

    // Add the ID to the values array for the WHERE clause
    const queryValues = [...values, id];

    // Construct the SQL query
    const query = `UPDATE templates SET ${columns} WHERE id = ?`;

    // Execute the query
    const stmt = db.prepare(query);
    const info = stmt.run(...queryValues);

    if (info.changes === 0) {
      event.reply("template-updated", {
        success: false,
        message: "No template found with the given ID.",
      });
    } else {
      event.reply("template-updated", {
        success: true,
        message: "Template updated successfully.",
      });
    }
  } catch (error) {
    console.error("Error updating template:", error.message);
    event.reply("template-updated", {
      success: false,
      error: "Failed to update template.",
    });
  }
});

ipcMain.on("delete-templates", (event, id) => {
  db.prepare("DELETE FROM templates WHERE id = ?").run(id);
});
// Listen for the 'authenticate-user' event from the renderer process
ipcMain.on("authenticate-user", (event, credentials) => {
  const { email, password } = credentials;
  try {
    // Prepare the SQL statement
    const stmt = db.prepare(
      "SELECT role FROM users WHERE email = ? AND password = ?",
    );
    const row = stmt.get(email, password);
    if (row) {
      // User exists, send the role back to the renderer process
      event.reply("authentication-result", { success: true, user: row });
    } else {
      // User does not exist
      event.reply("authentication-result", {
        success: false,
        message: "ERROR_CREDENTIALS",
      });
    }
  } catch (err) {
    console.error("Database query error:", err.message);
    event.reply("authentication-result", {
      success: false,
      message: "An error occurred.",
    });
  }
});
// Helper function to parse printer output based on platform
function parsePrinterOutput(output: string, platform: string): string[] {
  if (platform === "win32") {
    return output
      .trim()
      .split("\n")
      .filter((line) => line.trim() !== "" && !line.startsWith("Name"))
      .map((line) => line.split(/\s+/).join(" ").trim());
  } else if (platform === "darwin" || platform === "linux") {
    return output
      .trim()
      .split("\n")
      .filter(
        (line) => line.startsWith("l’imprimante") || line.startsWith("printer"),
      )
      .map((line) => line.split(" ")[1]);
  }
  return [];
}

function parsePrinterStatus(
  output: string,
  platform: string,
): PrinterStatusResponse {
  if (platform === "darwin" || platform === "linux") {
    const lines = output.split("\n");
    const statusLine = lines.find(
      (line) => line.includes(" is ") || line.includes(" est "),
    );
    if (!statusLine) return { error: "Status not found" };

    const isActive =
      statusLine.includes("enabled") ||
      statusLine.includes("idle") ||
      !statusLine.includes("inactive");

    const statusText =
      statusLine.split(" is ")[1] || statusLine.split(" est ")[1];
    return {
      status: statusText,
    };
  } else if (platform === "win32") {
    try {
      const parsedOutput: ParsedOutput = JSON.parse(output); // Explicitly type parsedOutput
      const status: { [key: number]: string } = {
        0: "Idle",
        1: "Busy",
        2: "Door Open",
        3: "Paper Jam",
        4: "Out of Paper",
        5: "Offline",
        6: "I/O Active",
        7: "Manual Feed",
        8: "Paper Problem",
        9: "No Toner",
        10: "Page Punt",
        11: "User Intervention Required",
        12: "Out of Memory",
        13: "Server Unknown",
      };

      // Ensure parsedOutput.PrinterStatus is a valid key
      const printerStatus = parsedOutput.PrinterStatus as keyof typeof status;

      return {
        name: parsedOutput.Name,
        status: status[printerStatus], // Access status using the valid key
        detectedError: parsedOutput.DetectedErrorState,
        inkLevels: parsedOutput.InkLevels,
      };
    } catch (error) {
      return { error: "Failed to parse printer status" };
    }
  }
  return { error: "Unsupported platform" };
}
