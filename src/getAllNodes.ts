import { Graph } from "./api";

export const getAllNodes = (graph: Graph) => [...graph.types, ...graph.properties];
