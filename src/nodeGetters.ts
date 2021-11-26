import { Node, Graph } from "./api";
import { getAllNodes } from "./getAllNodes";

export const defCheckDependers = (graph: Readonly<Graph>) => (ids: Array<Node["id"]>) => {
    return getAllNodes(graph)
        .filter((node) => ids.includes(node.id))
        .every((node) => isEnabled(graph, node));
};

export const isVisible = (graph: Readonly<Graph>, datum: Readonly<Node>) => {
    if (datum.type === "1" || datum.type === "2") {
        return true;
    }

    return getAllNodes(graph)
        .filter((node) => node.properties.includes(datum.id))
        .some((node) => isEnabled(graph, node));
};

export const isEnabled = (graph: Readonly<Graph>, node: Readonly<Node>) => {
    if (node.userEnabled) {
        return true;
    }

    if (node.enabledBy.some((ids) => defCheckDependers(graph)(ids))) {
        return true;
    }

    if (node.type === "requirement") {
        const found = getAllNodes(graph).find((f_node) => f_node.properties.includes(node.id));

        if (found !== undefined && isEnabled(graph, found)) {
            return true;
        }
    }

    return false;
};

export const isDisabled = (graph: Readonly<Graph>, node: Readonly<Node>) => {
    return node.disabledBy.some(defCheckDependers(graph));
};

export const getRadius = (node: Readonly<Node>) =>
    ({
        1: 50,
        2: 40,
        property: 20,
        requirement: 30,
    }[node.type]);
