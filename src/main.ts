import * as d3 from "d3";
import { getById } from "./getById";

interface Node extends d3.SimulationNodeDatum {
    id: string;
    type: "1" | "2" | "property" | "requirement";
    enabledBy: Array<string[]>;
    disabledBy: Array<string[]>;
    properties: string[];
    userEnabled?: boolean;
    enable: () => void;
    disable: () => void;
    toggle: () => void;
    enabled: boolean;
    disabled: boolean;
    visible: boolean;
    radius: number;
}

type Link = d3.SimulationLinkDatum<Node>;

const isNode = (node: unknown): node is Node => typeof node === "object";

interface Graph {
    types: Node[];
    properties: Node[];
    links: Link[];
}

const svg = d3.select("#content").append("svg");
const simulation = d3
    .forceSimulation<Node, Link>()
    .force(
        "link",
        d3
            .forceLink<Node, Link>()
            .id((d: Node) => d.id)
            .distance((_d) => 150),
    )
    .force("charge", d3.forceManyBody().strength(-10))
    .force(
        "collide",
        d3.forceCollide<Node>().radius((d: Node) => d.radius),
    );

const updateSize = () => {
    const content = getById("content");
    const width = content.clientWidth;
    const height = content.clientHeight;

    svg.attr("width", width);
    svg.attr("height", height);

    simulation.force("center", d3.forceCenter(width / 2, height / 2));
};

window.addEventListener("resize", updateSize, { passive: true });

updateSize();

const getEvent = (d3: unknown) => <d3.D3DragEvent<SVGGElement, Node, SVGGElement>>(d3 as any).event;
const dragHandler = d3
    .drag<SVGGElement, Node, SVGGElement>()
    .on("start", (d: Node) => {
        const event = getEvent(d3);

        if (!event.active) {
            simulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
    })
    .on("drag", (d: Node) => {
        const event = getEvent(d3);
        d.fx = event.x;
        d.fy = event.y;
    })
    .on("end", (d: Node) => {
        const event = getEvent(d3);
        if (!event.active) {
            simulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
    });

interface State {
    node: d3.Selection<SVGGElement, Node, SVGGElement, unknown>;
    prop: d3.Selection<SVGGElement, Node, SVGGElement, unknown>;
    link: d3.Selection<SVGLineElement, Link, SVGGElement, unknown>;
}

const render = (state: State) => {
    const getAlpha = (n: Node) => (n.enabled ? 1.0 : n.disabled ? 0.1 : 0.5);
    const getColor = (n: Node) => {
        return {
            "1": `rgba(43, 156, 212, ${getAlpha(n)})`,
            "2": `rgba(43, 212, 156, ${getAlpha(n)})`,
            property: `rgba(249, 182, 118, ${getAlpha(n)})`,
            requirement: `rgba(212, 100, 100, ${getAlpha(n)})`,
        }[n.type];
    };

    state.node.attr("display", (n: Node) => (n.visible ? "" : "none"));

    state.node.selectAll<d3.BaseType, Node>("circle").attr("fill", (n: Node) => getColor(n));

    state.node
        .selectAll<d3.BaseType, Node>("text")
        .attr("fill", (n: Node) => `rgba(0, 0, 0, ${getAlpha(n)})`);

    state.node
        .selectAll<d3.BaseType, Node>(".ring")
        .attr("fill", "none")
        .attr("stroke", (n: Node) => `rgba(${getColor(n)}, ${n.userEnabled ? 1.0 : 0.0})`);

    state.prop.attr("display", (n: Node) => (n.visible ? "" : "none"));

    state.prop.selectAll<d3.BaseType, Node>("circle").attr("fill", (n: Node) => getColor(n));

    state.prop
        .selectAll<d3.BaseType, Node>("text")
        .attr("fill", (n: Node) => `rgba(0, 0, 0, ${getAlpha(n)})`);

    state.prop
        .selectAll<d3.BaseType, Node>(".ring")
        .attr("fill", "none")
        .attr("stroke", (n: Node) => `rgba(${getColor(n)}, ${n.userEnabled ? 1.0 : 0.0})`);

    state.link.attr("display", (l) => (isNode(l.source) ? (l.source.enabled ? "" : "none") : ""));
    state.link.attr("stroke-width", 2);
};

const ticked = (state: State) => {
    state.node.attr("transform", (d: Node) => `translate(${d.x}, ${d.y})`);

    state.prop.attr("transform", (d: Node) => {
        return `translate(${d.x}, ${d.y})`;
    });

    state.link
        .attr("x1", (l: Link) => (isNode(l.source) ? l.source.x ?? 0 : 0))
        .attr("y1", (l: Link) => (isNode(l.source) ? l.source.y ?? 0 : 0))
        .attr("x2", (l: Link) => (isNode(l.target) ? l.target.x ?? 0 : 0))
        .attr("y2", (l: Link) => (isNode(l.target) ? l.target.y ?? 0 : 0));
};

const main = (graph: Graph) => {
    graph.links = [];

    // set up objects
    [graph.types, graph.properties].forEach((set) => {
        set.forEach((n: Node) => {
            n.userEnabled = false;

            n.enable = () => (n.userEnabled = true);
            n.disable = () => (n.userEnabled = false);
            n.toggle = () => (n.userEnabled ? n.disable() : n.enable());

            n.x = parseInt(svg.attr("width")) / 2;
            n.y = parseInt(svg.attr("height")) / 2;

            Object.defineProperties(n, {
                visible: {
                    get: () => {
                        if (["1", "2"].includes(n.type)) {
                            return true;
                        }

                        return [...graph.types, ...graph.properties]
                            .filter((node) => node.properties.includes(n.id))
                            .some((node) => node.enabled);
                    },
                },
                enabled: {
                    get: () => {
                        const enabledByOther = n.enabledBy.some((ids) => {
                            return [...graph.types, ...graph.properties]
                                .filter((node) => ids.includes(node.id))
                                .every((node) => node.enabled);
                        });
                        let requirementEnabled = false;
                        if (n.type === "requirement") {
                            const parent = [...graph.types, ...graph.properties].find((node) => {
                                return node.properties.includes(n.id);
                            });
                            requirementEnabled = parent !== undefined && parent.enabled;
                        }

                        return n.userEnabled || enabledByOther || requirementEnabled;
                    },
                },
                disabled: {
                    get: () => {
                        return n.disabledBy.some((ids) => {
                            return [...graph.types, ...graph.properties]
                                .filter((node) => ids.includes(node.id))
                                .every((node) => node.enabled);
                        });
                    },
                },
                radius: {
                    get: () => {
                        const radii = {
                            1: 50,
                            2: 40,
                            property: 20,
                            requirement: 30,
                        } as const;

                        return radii[n.type];
                    },
                },
            });
        });
    });

    const createState = (graph: Graph): State => {
        const node = svg
            .append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(graph.types)
            .enter()
            .append("g")
            .call(dragHandler);

        const prop = svg
            .append("g")
            .attr("class", "properties")
            .selectAll("circle")
            .data(graph.properties)
            .enter()
            .append("g")
            .call(dragHandler);

        const link = svg
            .append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graph.links)
            .enter()
            .append("line");

        return { node, prop, link };
    };

    const restart = (state?: State) => {
        if (state !== undefined) {
            state.node.remove();
            state.prop.remove();
            state.link.remove();
        }

        graph.links = [];
        const allNodes = [...graph.types, ...graph.properties];
        for (const datum of allNodes) {
            if (datum.enabled) {
                datum.properties.forEach((prop) => {
                    const target = allNodes.find((n: Node) => n.id === prop);
                    if (target !== undefined) {
                        graph.links.push({
                            source: datum,
                            target,
                        });
                    }
                });
            }
        }

        const newState = createState(graph);

        simulation
            .nodes([...graph.types, ...graph.properties].filter((n: Node) => n.visible))
            .on("tick", () => ticked(newState));

        simulation.force("link", d3.forceLink(graph.links));

        newState.node.append("circle").attr("r", (d: Node) => d.radius);

        newState.node
            .append("circle")
            .attr("r", (d: Node) => d.radius * 1.1)
            .classed("ring", true);

        newState.node
            .append("text")
            .attr("dx", 12)
            .attr("dy", 20)
            .text((d: Node) => d.id.replace(/_/g, " "));

        newState.node.on("click", (d: Node) => {
            if (d.disabled) {
                return;
            }
            d.toggle();
            restart(newState);
        });

        newState.prop.append("circle").attr("r", (d: Node) => d.radius);

        newState.prop
            .append("circle")
            .attr("r", (d: Node) => d.radius * 1.1)
            .classed("ring", true);

        newState.prop
            .append("text")
            .attr("dx", 12)
            .attr("dy", 20)
            .text((d: Node) => d.id.replace(/_/g, " "));

        newState.prop.on("click", (d: Node) => {
            if (d.disabled) {
                return;
            }
            d.toggle();
            restart(newState);
        });

        render(newState);

        const list = getById("list");
        const requirements = getById("requirements");
        const suggestions = getById("suggestions");

        for (const ul of [list, requirements, suggestions]) {
            for (const child of Array.from(ul.children)) {
                child.remove();
            }
        }

        for (const datum of graph.types) {
            if (datum.userEnabled || (datum.enabled && datum.type !== "requirement")) {
                const li = document.createElement("li");
                li.textContent = datum.id.replace(/_/g, " ");
                list.appendChild(li);
            }
        }

        for (const datum of graph.properties) {
            if (datum.visible || (datum.enabled && !datum.userEnabled)) {
                const li = document.createElement("li");
                li.textContent = datum.id.replace(/_/g, " ");
                const list = datum.type === "requirement" ? requirements : suggestions;
                list.appendChild(li);
            }
        }
    };

    restart();
};

d3.json("data/numbers.json", (error, graph: Graph) => {
    if (error) {
        throw error;
    }
    main(graph);
});
