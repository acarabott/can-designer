import { Graph, Node } from "./api";

export const defCheckDependers = (graph: Readonly<Graph>) => (ids: Array<Node["id"]>) => {
    return [...graph.types, ...graph.properties]
        .filter((node) => ids.includes(node.id))
        .every((node) => isEnabled(graph, node));
};

export const isVisible = (graph: Readonly<Graph>, datum: Readonly<Node>) => {
    if (["1", "2"].includes(datum.type)) {
        return true;
    }

    return [...graph.types, ...graph.properties]
        .filter((node) => node.properties.includes(datum.id))
        .some((node) => isEnabled(graph, node));
};

export const isEnabled = (graph: Readonly<Graph>, datum: Readonly<Node>) => {
    if (datum.userEnabled) {
        return true;
    }

    if (datum.enabledBy.some((ids) => defCheckDependers(graph)(ids))) {
        return true;
    }

    if (datum.type === "requirement") {
        const found = [...graph.types, ...graph.properties].find((fdatum) =>
            fdatum.properties.includes(datum.id),
        );

        if (found !== undefined && isEnabled(graph, found)) {
            return true;
        }
    }

    return false;
};

export const isDisabled = (graph: Readonly<Graph>, datum: Readonly<Node>) => {
    return datum.disabledBy.some(defCheckDependers(graph));
};

export const getRadius = (datum: Readonly<Node>) =>
    ({
        1: 50,
        2: 40,
        property: 20,
        requirement: 30,
    }[datum.type]);
