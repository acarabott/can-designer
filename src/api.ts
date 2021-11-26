import { Simulation, SimulationLinkDatum, SimulationNodeDatum } from "d3-force";
import { Selection } from "d3-selection";
import { defLinkSVGs } from "./defLinkSVGs";
import { defNodeSVGs } from "./defNodeSVGs";
import { DatumID, DatumType } from "./model";

export interface Shape {
    width: number;
    height: number;
}

export interface Node extends SimulationNodeDatum {
    id: DatumID;
    type: DatumType;
    enabledBy: Array<Array<DatumID>>;
    disabledBy: Array<Array<DatumID>>;
    properties: DatumID[];
    userEnabled: boolean;
}

export type Link = SimulationLinkDatum<Node>;

export const isNode = (node: unknown): node is Node => typeof node === "object";

export type NodeSVGs = ReturnType<typeof defNodeSVGs>;
export type LinkSVGs = ReturnType<typeof defLinkSVGs>;

export type RootSVG = Selection<SVGSVGElement, unknown, HTMLElement, any>;

export interface Graph {
    types: Node[];
    properties: Node[];
    links: Link[];
}

export interface Model {
    simulation: Simulation<Node, Link>;
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
