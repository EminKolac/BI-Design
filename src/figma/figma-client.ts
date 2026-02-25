import axios, { AxiosInstance } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  fills?: FigmaFill[];
  style?: Record<string, unknown>;
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
}

interface FigmaFill {
  type: string;
  color?: { r: number; g: number; b: number; a: number };
}

interface FigmaFile {
  document: FigmaNode;
  name: string;
  lastModified: string;
  version: string;
}

interface FigmaStyles {
  [key: string]: {
    key: string;
    name: string;
    style_type: string;
    description: string;
  };
}

export interface DesignToken {
  name: string;
  type: "color" | "typography" | "spacing" | "effect";
  value: string | number | Record<string, unknown>;
}

export interface FigmaVariableCollection {
  id: string;
  name: string;
  modes: { modeId: string; name: string }[];
  variableIds: string[];
}

export interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: "BOOLEAN" | "FLOAT" | "STRING" | "COLOR";
  valuesByMode: Record<string, unknown>;
  variableCollectionId: string;
}

interface FigmaVariablesResponse {
  status: number;
  error: boolean;
  meta: {
    variableCollections: Record<string, FigmaVariableCollection>;
    variables: Record<string, FigmaVariable>;
  };
}

interface VariableChange {
  action: "CREATE" | "UPDATE" | "DELETE";
  id?: string;
  name?: string;
  variableCollectionId?: string;
  resolvedType?: "COLOR" | "FLOAT" | "STRING";
  valuesByMode?: Record<string, unknown>;
}

interface CollectionChange {
  action: "CREATE" | "UPDATE";
  id?: string;
  name: string;
  initialModeId?: string;
}

interface PostVariablesPayload {
  variableCollections?: CollectionChange[];
  variableModes?: { action: "CREATE" | "UPDATE"; id?: string; name: string; variableCollectionId: string }[];
  variables?: VariableChange[];
}

export class FigmaClient {
  private client: AxiosInstance;
  private fileKey: string;

  constructor() {
    const token = process.env.FIGMA_ACCESS_TOKEN;
    this.fileKey = process.env.FIGMA_FILE_KEY || "";

    if (!token) {
      throw new Error(
        "FIGMA_ACCESS_TOKEN is required. Get one from Figma > Settings > Personal Access Tokens"
      );
    }

    this.client = axios.create({
      baseURL: "https://api.figma.com/v1",
      headers: {
        "X-Figma-Token": token,
      },
    });
  }

  async getFile(): Promise<FigmaFile> {
    const response = await this.client.get(`/files/${this.fileKey}`);
    return response.data;
  }

  async getFileStyles(): Promise<FigmaStyles> {
    const response = await this.client.get(`/files/${this.fileKey}/styles`);
    return response.data.meta.styles;
  }

  async getNodeById(nodeId: string): Promise<FigmaNode> {
    const response = await this.client.get(
      `/files/${this.fileKey}/nodes?ids=${nodeId}`
    );
    return response.data.nodes[nodeId].document;
  }

  async exportNodeAsImage(
    nodeId: string,
    format: "png" | "svg" | "pdf" = "png",
    scale: number = 2
  ): Promise<string> {
    const response = await this.client.get(
      `/images/${this.fileKey}?ids=${nodeId}&format=${format}&scale=${scale}`
    );
    return response.data.images[nodeId];
  }

  async extractColorTokens(): Promise<DesignToken[]> {
    const file = await this.getFile();
    const tokens: DesignToken[] = [];

    const extractColors = (node: FigmaNode) => {
      if (node.fills) {
        for (const fill of node.fills) {
          if (fill.type === "SOLID" && fill.color) {
            const { r, g, b } = fill.color;
            const hex = rgbToHex(
              Math.round(r * 255),
              Math.round(g * 255),
              Math.round(b * 255)
            );
            tokens.push({
              name: node.name,
              type: "color",
              value: hex,
            });
          }
        }
      }
      if (node.children) {
        node.children.forEach(extractColors);
      }
    };

    extractColors(file.document);
    return tokens;
  }

  // ─── Variables API (for pushing tokens TO Figma) ───

  async getLocalVariables(): Promise<FigmaVariablesResponse> {
    const response = await this.client.get(`/files/${this.fileKey}/variables/local`);
    return response.data;
  }

  async postVariables(payload: PostVariablesPayload): Promise<void> {
    await this.client.post(`/files/${this.fileKey}/variables`, payload);
  }

  /**
   * Find or create a variable collection by name.
   * Returns the collection ID and default mode ID.
   */
  async ensureCollection(name: string): Promise<{ collectionId: string; modeId: string }> {
    const vars = await this.getLocalVariables();
    const existing = Object.values(vars.meta.variableCollections).find(
      (c) => c.name === name
    );

    if (existing) {
      return { collectionId: existing.id, modeId: existing.modes[0].modeId };
    }

    // Create a temporary ID for the new collection.
    // Figma assigns the real ID in the response.
    const tempId = `temp_collection_${Date.now()}`;
    await this.postVariables({
      variableCollections: [{ action: "CREATE", name, id: tempId }],
    });

    // Fetch again to get the real ID
    const updated = await this.getLocalVariables();
    const created = Object.values(updated.meta.variableCollections).find(
      (c) => c.name === name
    );
    if (!created) throw new Error(`Failed to create collection "${name}"`);
    return { collectionId: created.id, modeId: created.modes[0].modeId };
  }

  /**
   * Push a flat map of color tokens into a Figma variable collection.
   * Keys use "/" as group separator (e.g., "primary/700").
   * Values are hex color strings (e.g., "#00205B").
   */
  async pushColorVariables(
    collectionName: string,
    colors: Record<string, string>
  ): Promise<{ created: number; updated: number }> {
    const { collectionId, modeId } = await this.ensureCollection(collectionName);

    // Get existing variables in this collection
    const vars = await this.getLocalVariables();
    const existingByName = new Map<string, FigmaVariable>();
    for (const v of Object.values(vars.meta.variables)) {
      if (v.variableCollectionId === collectionId && v.resolvedType === "COLOR") {
        existingByName.set(v.name, v);
      }
    }

    let created = 0;
    let updated = 0;
    const changes: VariableChange[] = [];

    for (const [name, hex] of Object.entries(colors)) {
      const rgba = hexToFigmaColor(hex);
      const existing = existingByName.get(name);

      if (existing) {
        changes.push({
          action: "UPDATE",
          id: existing.id,
          valuesByMode: { [modeId]: rgba },
        });
        updated++;
      } else {
        changes.push({
          action: "CREATE",
          name,
          variableCollectionId: collectionId,
          resolvedType: "COLOR",
          valuesByMode: { [modeId]: rgba },
        });
        created++;
      }
    }

    // Figma limits batches to 1000 variables per request
    const BATCH_SIZE = 1000;
    for (let i = 0; i < changes.length; i += BATCH_SIZE) {
      await this.postVariables({ variables: changes.slice(i, i + BATCH_SIZE) });
    }

    return { created, updated };
  }

  /**
   * Push numeric tokens (spacing, font sizes) into a Figma variable collection.
   */
  async pushFloatVariables(
    collectionName: string,
    values: Record<string, number>
  ): Promise<{ created: number; updated: number }> {
    const { collectionId, modeId } = await this.ensureCollection(collectionName);

    const vars = await this.getLocalVariables();
    const existingByName = new Map<string, FigmaVariable>();
    for (const v of Object.values(vars.meta.variables)) {
      if (v.variableCollectionId === collectionId && v.resolvedType === "FLOAT") {
        existingByName.set(v.name, v);
      }
    }

    let created = 0;
    let updated = 0;
    const changes: VariableChange[] = [];

    for (const [name, value] of Object.entries(values)) {
      const existing = existingByName.get(name);
      if (existing) {
        changes.push({
          action: "UPDATE",
          id: existing.id,
          valuesByMode: { [modeId]: value },
        });
        updated++;
      } else {
        changes.push({
          action: "CREATE",
          name,
          variableCollectionId: collectionId,
          resolvedType: "FLOAT",
          valuesByMode: { [modeId]: value },
        });
        created++;
      }
    }

    const BATCH_SIZE = 1000;
    for (let i = 0; i < changes.length; i += BATCH_SIZE) {
      await this.postVariables({ variables: changes.slice(i, i + BATCH_SIZE) });
    }

    return { created, updated };
  }

  /**
   * Push string tokens (font families) into a Figma variable collection.
   */
  async pushStringVariables(
    collectionName: string,
    values: Record<string, string>
  ): Promise<{ created: number; updated: number }> {
    const { collectionId, modeId } = await this.ensureCollection(collectionName);

    const vars = await this.getLocalVariables();
    const existingByName = new Map<string, FigmaVariable>();
    for (const v of Object.values(vars.meta.variables)) {
      if (v.variableCollectionId === collectionId && v.resolvedType === "STRING") {
        existingByName.set(v.name, v);
      }
    }

    let created = 0;
    let updated = 0;
    const changes: VariableChange[] = [];

    for (const [name, value] of Object.entries(values)) {
      const existing = existingByName.get(name);
      if (existing) {
        changes.push({
          action: "UPDATE",
          id: existing.id,
          valuesByMode: { [modeId]: value },
        });
        updated++;
      } else {
        changes.push({
          action: "CREATE",
          name,
          variableCollectionId: collectionId,
          resolvedType: "STRING",
          valuesByMode: { [modeId]: value },
        });
        created++;
      }
    }

    const BATCH_SIZE = 1000;
    for (let i = 0; i < changes.length; i += BATCH_SIZE) {
      await this.postVariables({ variables: changes.slice(i, i + BATCH_SIZE) });
    }

    return { created, updated };
  }

  async extractLayoutSpecs(
    pageNodeId: string
  ): Promise<{ name: string; bounds: { x: number; y: number; width: number; height: number } }[]> {
    const node = await this.getNodeById(pageNodeId);
    const specs: { name: string; bounds: { x: number; y: number; width: number; height: number } }[] = [];

    const extractBounds = (n: FigmaNode) => {
      if (n.absoluteBoundingBox) {
        specs.push({
          name: n.name,
          bounds: n.absoluteBoundingBox,
        });
      }
      if (n.children) {
        n.children.forEach(extractBounds);
      }
    };

    extractBounds(node);
    return specs;
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
      .toUpperCase()
  );
}

/**
 * Convert a hex color string to Figma's RGBA format (0-1 range).
 */
function hexToFigmaColor(hex: string): { r: number; g: number; b: number; a: number } {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16) / 255;
  const g = parseInt(cleaned.substring(2, 4), 16) / 255;
  const b = parseInt(cleaned.substring(4, 6), 16) / 255;
  return { r, g, b, a: 1 };
}
