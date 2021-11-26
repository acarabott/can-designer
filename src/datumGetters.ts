import { Datum, Graph } from "./api";

export const defCheckDependers = (graph: Readonly<Graph>) => (ids: Array<Datum["id"]>) => {
    return [...graph.types, ...graph.properties]
        .filter((node) => ids.includes(node.id))
        .every((node) => isEnabled(graph, node));
};

export const isVisible = (graph: Readonly<Graph>, datum: Readonly<Datum>) => {
    if (datum.type === "1" || datum.type === "2") {
        return true;
    }

    return [...graph.types, ...graph.properties]
        .filter((node) => node.properties.includes(datum.id))
        .some((node) => isEnabled(graph, node));
};

export const isEnabled = (graph: Readonly<Graph>, datum: Readonly<Datum>) => {
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

export const isDisabled = (graph: Readonly<Graph>, datum: Readonly<Datum>) => {
    return datum.disabledBy.some(defCheckDependers(graph));
};

export const getRadius = (datum: Readonly<Datum>) =>
    ({
        1: 50,
        2: 40,
        property: 20,
        requirement: 30,
    }[datum.type]);
