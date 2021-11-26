import { DatumID, DatumType } from "./model";

export interface Shape {
    width: number;
    height: number;
}

export interface Node extends d3.SimulationNodeDatum {
    id: DatumID;
    type: DatumType;
    enabledBy: Array<Array<DatumID>>;
    disabledBy: Array<Array<DatumID>>;
    properties: DatumID[];
    userEnabled: boolean;
}

export type Link = d3.SimulationLinkDatum<Node>;

export const isNode = (node: unknown): node is Node => typeof node === "object";

export type NodeSVGs = d3.Selection<SVGGElement, Node, SVGGElement, unknown>;
export type LinkSVGs = d3.Selection<SVGLineElement, Link, SVGGElement, unknown>;

export type RootSVG = d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
export type Simulation = d3.Simulation<Node, Link>;

export interface Graph {
    types: Node[];
    properties: Node[];
    links: Link[];
}

export interface Model {
    simulation: Simulation;
    graph: Graph;
}

export interface Context {
    model: Model;
    views: {
        root: RootSVG;
        types: NodeSVGs;
        properties: NodeSVGs;
        links: LinkSVGs;
    };
}
