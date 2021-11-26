import { DatumID, DatumType } from "./model";

export interface Shape {
    width: number;
    height: number;
}

export interface Datum extends d3.SimulationNodeDatum {
    id: DatumID;
    type: DatumType;
    enabledBy: Array<Array<DatumID>>;
    disabledBy: Array<Array<DatumID>>;
    properties: DatumID[];
    userEnabled: boolean;
}

export type Link = d3.SimulationLinkDatum<Datum>;

export const isNode = (node: unknown): node is Datum => typeof node === "object";

export type DatumSVGs = d3.Selection<SVGGElement, Datum, SVGGElement, unknown>;
export type LinkSVGs = d3.Selection<SVGLineElement, Link, SVGGElement, unknown>;

export type RootSVG = d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
export type Simulation = d3.Simulation<Datum, Link>;

export interface Graph {
    types: Datum[];
    properties: Datum[];
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
        types: DatumSVGs;
        properties: DatumSVGs;
        links: LinkSVGs;
    };
}
