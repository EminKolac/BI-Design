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
