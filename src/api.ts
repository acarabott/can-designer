export interface Node extends d3.SimulationNodeDatum {
    id: string;
    type: "1" | "2" | "property" | "requirement";
    enabledBy: Array<string[]>;
    disabledBy: Array<string[]>;
    properties: string[];
    userEnabled: boolean;
}

export type Link = d3.SimulationLinkDatum<Node>;

export const isNode = (node: unknown): node is Node => typeof node === "object";

export interface Graph {
    types: Node[];
    properties: Node[];
    links: Link[];
}

export type DatumSelection = d3.Selection<SVGGElement, Node, SVGGElement, unknown>;
export type LinkSelection = d3.Selection<SVGLineElement, Link, SVGGElement, unknown>;

export type SVG = d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
export type Simulation = d3.Simulation<Node, Link>;

export interface State {
    node: DatumSelection;
    prop: DatumSelection;
    link: LinkSelection;
}
