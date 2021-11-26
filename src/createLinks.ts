import { Graph, Link, Node } from "./api";
import { isEnabled } from "./nodeGetters";

export const createLinks = (graph: Readonly<Graph>) => {
    const links: Link[] = [];
    const allNodes = [...graph.types, ...graph.properties];

    for (const node of allNodes) {
        if (isEnabled(graph, node)) {
            for (const prop of node.properties) {
                const target = allNodes.find((f_node: Node) => f_node.id === prop);
                if (target !== undefined) {
                    links.push({
                        source: node,
                        target,
                    });
                }
            }
        }
    }

    return links;
};
