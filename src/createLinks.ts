import { Graph, Link, Datum } from "./api";
import { isEnabled } from "./datumGetters";

export const createLinks = (graph: Readonly<Graph>) => {
    const links: Link[] = [];
    const allNodes = [...graph.types, ...graph.properties];

    for (const datum of allNodes) {
        if (isEnabled(graph, datum)) {
            datum.properties.forEach((prop) => {
                const target = allNodes.find((n: Datum) => n.id === prop);
                if (target !== undefined) {
                    links.push({
                        source: datum,
                        target,
                    });
                }
            });
        }
    }

    return links;
};
