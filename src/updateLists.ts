import { Graph, Node } from "./api";
import { isEnabled, isVisible } from "./datumGetters";
import { getById } from "./getById";

export const updateLists = (graph: Readonly<Graph>) => {
    const list = getById("list");
    const requirements = getById("requirements");
    const suggestions = getById("suggestions");

    for (const ul of [list, requirements, suggestions]) {
        for (const child of Array.from(ul.children)) {
            child.remove();
        }
    }

    const defLi = (datum: Node) => {
        const li = document.createElement("li");
        li.textContent = datum.id.replace(/_/g, " ");
        return li;
    };

    for (const datum of graph.types) {
        if (datum.userEnabled || (isEnabled(graph, datum) && datum.type !== "requirement")) {
            list.appendChild(defLi(datum));
        }
    }

    for (const datum of graph.properties) {
        if (isVisible(graph, datum) || (isEnabled(graph, datum) && !datum.userEnabled)) {
            const list = datum.type === "requirement" ? requirements : suggestions;
            list.appendChild(defLi(datum));
        }
    }
};
