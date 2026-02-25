import axios, { AxiosInstance } from "axios";
import { ConfidentialClientApplication } from "@azure/msal-node";
import * as dotenv from "dotenv";

dotenv.config();

interface PowerBIReport {
  id: string;
  name: string;
  webUrl: string;
  embedUrl: string;
  datasetId: string;
}

interface PowerBIDataset {
  id: string;
  name: string;
  configuredBy: string;
  isRefreshable: boolean;
}

interface PowerBIWorkspace {
  id: string;
  name: string;
  type: string;
  isReadOnly: boolean;
}

interface EmbedToken {
  token: string;
  tokenId: string;
  expiration: string;
}

export class PowerBIClient {
  private client: AxiosInstance | null = null;
  private msalClient: ConfidentialClientApplication;
  private workspaceId: string;

  constructor() {
    this.workspaceId = process.env.POWERBI_WORKSPACE_ID || "";

    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.AZURE_CLIENT_ID || "",
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET || "",
      },
    });
  }

  private async getAccessToken(): Promise<string> {
    const result = await this.msalClient.acquireTokenByClientCredential({
      scopes: ["https://analysis.windows.net/powerbi/api/.default"],
    });

    if (!result) {
      throw new Error("Failed to acquire access token");
    }

    return result.accessToken;
  }

  private async ensureClient(): Promise<AxiosInstance> {
    if (!this.client) {
      const token = await this.getAccessToken();
      this.client = axios.create({
        baseURL: "https://api.powerbi.com/v1.0/myorg",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    }
    return this.client;
  }

  async listWorkspaces(): Promise<PowerBIWorkspace[]> {
    const client = await this.ensureClient();
    const response = await client.get("/groups");
    return response.data.value;
  }

  async listReports(): Promise<PowerBIReport[]> {
    const client = await this.ensureClient();
    const response = await client.get(
      `/groups/${this.workspaceId}/reports`
    );
    return response.data.value;
  }

  async getReport(reportId: string): Promise<PowerBIReport> {
    const client = await this.ensureClient();
    const response = await client.get(
      `/groups/${this.workspaceId}/reports/${reportId}`
    );
    return response.data;
  }

  async listDatasets(): Promise<PowerBIDataset[]> {
    const client = await this.ensureClient();
    const response = await client.get(
      `/groups/${this.workspaceId}/datasets`
    );
    return response.data.value;
  }

  async applyTheme(reportId: string, themePath: string): Promise<void> {
    const fs = await import("fs");
    const theme = JSON.parse(fs.readFileSync(themePath, "utf-8"));

    const client = await this.ensureClient();
    await client.post(
      `/groups/${this.workspaceId}/reports/${reportId}/UpdateReportContent`,
      {
        sourceType: "ExistingReport",
        sourceReport: { reportId },
        theme,
      }
    );
  }

  async generateEmbedToken(reportId: string): Promise<EmbedToken> {
    const client = await this.ensureClient();
    const response = await client.post(
      `/groups/${this.workspaceId}/reports/${reportId}/GenerateToken`,
      {
        accessLevel: "View",
        allowSaveAs: false,
      }
    );
    return response.data;
  }

  async cloneReport(
    reportId: string,
    newName: string,
    targetWorkspaceId?: string
  ): Promise<PowerBIReport> {
    const client = await this.ensureClient();
    const response = await client.post(
      `/groups/${this.workspaceId}/reports/${reportId}/Clone`,
      {
        name: newName,
        targetWorkspaceId: targetWorkspaceId || this.workspaceId,
      }
    );
    return response.data;
  }

  async refreshDataset(datasetId: string): Promise<void> {
    const client = await this.ensureClient();
    await client.post(
      `/groups/${this.workspaceId}/datasets/${datasetId}/refreshes`
    );
  }

  async exportReport(
    reportId: string,
    format: "PDF" | "PPTX" | "PNG" = "PDF"
  ): Promise<Buffer> {
    const client = await this.ensureClient();

    // Start export
    const exportResponse = await client.post(
      `/groups/${this.workspaceId}/reports/${reportId}/ExportTo`,
      { format }
    );

    const exportId = exportResponse.data.id;

    // Poll for completion
    let status = "Running";
    while (status === "Running" || status === "NotStarted") {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const statusResponse = await client.get(
        `/groups/${this.workspaceId}/reports/${reportId}/exports/${exportId}`
      );
      status = statusResponse.data.status;

      if (status === "Failed") {
        throw new Error("Report export failed");
      }
    }

    // Download the file
    const fileResponse = await client.get(
      `/groups/${this.workspaceId}/reports/${reportId}/exports/${exportId}/file`,
      { responseType: "arraybuffer" }
    );

    return Buffer.from(fileResponse.data);
  }
}
