import * as d3 from "d3";

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

const svg = d3.select("body").append("svg");
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
    const width = window.innerWidth;
    const height = window.innerHeight;

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

    const render = () => {
        if (node === undefined || prop === undefined || link === undefined) {
            return;
        }

        const getAlpha = (n: Node) => (n.enabled ? 1.0 : n.disabled ? 0.1 : 0.5);
        const getColor = (n: Node) => {
            return {
                "1": `rgba(43, 156, 212, ${getAlpha(n)})`,
                "2": `rgba(43, 212, 156, ${getAlpha(n)})`,
                property: `rgba(249, 182, 118, ${getAlpha(n)})`,
                requirement: `rgba(212, 100, 100, ${getAlpha(n)})`,
            }[n.type];
        };

        node.attr("display", (n: Node) => (n.visible ? "" : "none"));

        node.selectAll<d3.BaseType, Node>("circle").attr("fill", (n: Node) => getColor(n));

        node.selectAll<d3.BaseType, Node>("text").attr("fill", (n: Node) => `rgba(0, 0, 0, ${getAlpha(n)})`);

        node.selectAll<d3.BaseType, Node>(".ring")
            .attr("fill", "none")
            .attr("stroke", (n: Node) => `rgba(${getColor(n)}, ${n.userEnabled ? 1.0 : 0.0})`);

        prop.attr("display", (n: Node) => (n.visible ? "" : "none"));

        prop.selectAll<d3.BaseType, Node>("circle").attr("fill", (n: Node) => getColor(n));

        prop.selectAll<d3.BaseType, Node>("text").attr("fill", (n: Node) => `rgba(0, 0, 0, ${getAlpha(n)})`);

        prop.selectAll<d3.BaseType, Node>(".ring")
            .attr("fill", "none")
            .attr("stroke", (n: Node) => `rgba(${getColor(n)}, ${n.userEnabled ? 1.0 : 0.0})`);

        link.attr("display", (l) => (isNode(l.source) ? (l.source.enabled ? "" : "none") : ""));
        link.attr("stroke-width", 2);
    };

    const ticked = () => {
        if (node === undefined || prop === undefined || link === undefined) {
            return;
        }

        node.attr("transform", (d: Node) => `translate(${d.x}, ${d.y})`);
        prop.attr("transform", (d: Node) => {
            return `translate(${d.x}, ${d.y})`;
        });

        link.attr("x1", (l: Link) => (isNode(l.source) ? l.source.x ?? 0 : 0))
            .attr("y1", (l: Link) => (isNode(l.source) ? l.source.y ?? 0 : 0))
            .attr("x2", (l: Link) => (isNode(l.target) ? l.target.x ?? 0 : 0))
            .attr("y2", (l: Link) => (isNode(l.target) ? l.target.y ?? 0 : 0));
    };

    const createLinks = () => {
        graph.links = [];
        [graph.types, graph.properties].forEach((set) => {
            set.forEach((n: Node) => {
                if (n.enabled) {
                    n.properties.forEach((prop) => {
                        const target = [...graph.types, ...graph.properties].find((n: Node) => n.id === prop);
                        if (target !== undefined) {
                            graph.links.push({
                                source: n,
                                target,
                            });
                        }
                    });
                }
            });
        });
    };

    let node: d3.Selection<SVGGElement, Node, SVGGElement, unknown> | undefined;
    let prop: d3.Selection<SVGGElement, Node, SVGGElement, unknown> | undefined;
    let link: d3.Selection<SVGLineElement, Link, SVGGElement, unknown>;
    const restart = () => {
        if (node !== undefined) {
            node.remove();
        }

        node = svg
            .append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(graph.types)
            .enter()
            .append("g")
            .call(dragHandler);

        if (prop !== undefined) {
            prop.remove();
        }

        prop = svg
            .append("g")
            .attr("class", "properties")
            .selectAll("circle")
            .data(graph.properties)
            .enter()
            .append("g")
            .call(dragHandler);

        if (link !== undefined) {
            link.remove();
        }

        createLinks();

        link = svg.append("g").attr("class", "links").selectAll("line").data(graph.links).enter().append("line");

        simulation.nodes([...graph.types, ...graph.properties].filter((n: Node) => n.visible)).on("tick", ticked);

        simulation.force("link", d3.forceLink(graph.links));

        node.append("circle").attr("r", (d: Node) => d.radius);

        node.append("circle")
            .attr("r", (d: Node) => d.radius * 1.1)
            .classed("ring", true);

        node.append("text")
            .attr("dx", 12)
            .attr("dy", 20)
            .text((d: Node) => d.id.replace(/_/g, " "));

        node.on("click", (d: Node) => {
            if (d.disabled) {
                return;
            }
            d.toggle();
            restart();
        });

        prop.append("circle").attr("r", (d: Node) => d.radius);

        prop.append("circle")
            .attr("r", (d: Node) => d.radius * 1.1)
            .classed("ring", true);

        prop.append("text")
            .attr("dx", 12)
            .attr("dy", 20)
            .text((d: Node) => d.id.replace(/_/g, " "));

        prop.on("click", (d: Node) => {
            if (d.disabled) {
                return;
            }
            d.toggle();
            restart();
        });

        render();

        const list = document.getElementById("list");
        if (list === null) {
            throw new ReferenceError("Couldn't find element with id #list");
        }

        Array.from(list.children).forEach((c) => c.remove());

        graph.types
            .filter((n: Node) => n.userEnabled || (n.enabled && n.type !== "requirement"))
            .forEach((n: Node) => {
                const li = document.createElement("li");
                li.textContent = n.id.replace(/_/g, " ");
                list.appendChild(li);
            });

        const requirements = document.getElementById("requirements");
        if (requirements === null) {
            throw new ReferenceError("Couldn't find element with id #requirements");
        }
        Array.from(requirements.children).forEach((c) => c.remove());
        graph.properties
            .filter((n: Node) => n.type === "requirement" && n.enabled && !n.userEnabled)
            .forEach((n: Node) => {
                const li = document.createElement("li");
                li.textContent = n.id.replace(/_/g, " ");
                requirements.appendChild(li);
            });

        const suggestions = document.getElementById("suggestions");
        if (suggestions === null) {
            throw new ReferenceError("Couldn't find element with id #suggestions");
        }
        Array.from(suggestions.children).forEach((c) => c.remove());

        graph.properties
            .filter((n: Node) => n.visible)
            .forEach((n: Node) => {
                const li = document.createElement("li");
                li.textContent = n.id.replace(/_/g, " ");
                suggestions.appendChild(li);
            });

        graph.properties
            .filter((n: Node) => n.enabled && !n.userEnabled)
            .forEach((n: Node) => {
                const li = document.createElement("li");
                li.textContent = n.id.replace(/_/g, " ");
                suggestions.appendChild(li);
            });
    };

    restart();
};

d3.json("data/numbers.json", (error, graph: Graph) => {
    if (error) {
        throw error;
    }
    main(graph);
});
